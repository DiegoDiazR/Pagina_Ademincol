const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./db');
const mailer = require('./mailer');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'cambia-este-token';

function fireAndForget(promise, label) {
  Promise.resolve(promise).catch((err) => {
    console.error(`[mailer:${label}] excepción no capturada:`, err);
  });
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Sirve el sitio estático compilado por Astro (../dist) desde el mismo proceso.
// Así Cloudflare Tunnel apunta a UN solo servicio (este) para el sitio y el /api.
// Las peticiones /api/* no coinciden con archivos y pasan a las rutas de abajo.
const DIST_DIR = path.join(__dirname, '..', 'dist');
app.use(express.static(DIST_DIR, { extensions: ['html'] }));

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES }
});

const TIPOS_PQRSF = new Set(['peticion', 'queja', 'reclamo', 'sugerencia', 'felicitacion']);
const HSE_VALORES = new Set(['si', 'no']);

const trim = (v) => (typeof v === 'string' ? v.trim() : '');
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const toNum = (v) => (typeof v === 'bigint' ? Number(v) : v);

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
}

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ademincol-forms', time: new Date().toISOString() });
});

app.post('/api/cotizacion', (req, res) => {
  const alcance = trim(req.body.alcance);
  const ubicacion = trim(req.body.ubicacion);
  const rut = trim(req.body.rut);
  const correo = trim(req.body.correo).toLowerCase();
  const hse = trim(req.body.hse).toLowerCase();
  const otros = trim(req.body.otros);

  if (!alcance) {
    return res.status(400).json({ ok: false, error: 'El alcance del servicio es obligatorio.' });
  }
  if (!ubicacion) {
    return res.status(400).json({ ok: false, error: 'La ubicación es obligatoria.' });
  }
  if (!rut) {
    return res.status(400).json({ ok: false, error: 'El RUT es obligatorio.' });
  }
  if (!correo || !isEmail(correo)) {
    return res.status(400).json({ ok: false, error: 'Correo electrónico inválido.' });
  }
  if (hse && !HSE_VALORES.has(hse)) {
    return res.status(400).json({ ok: false, error: 'Valor de HSE inválido.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO cotizaciones (alcance, ubicacion, rut, correo, hse, otros, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      alcance,
      ubicacion,
      rut,
      correo,
      hse || null,
      otros || null,
      clientIp(req),
      (req.headers['user-agent'] || '').slice(0, 500)
    );
    const id = toNum(info.lastInsertRowid);

    const cotizacionData = { id, alcance, ubicacion, rut, correo, hse, otros, ip: clientIp(req) };
    fireAndForget(mailer.sendCotizacionToAdemincol(cotizacionData), 'cotizacion-admin');
    fireAndForget(mailer.sendCotizacionAcknowledgement(cotizacionData), 'cotizacion-ack');

    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error('[cotizacion]', err);
    return res.status(500).json({ ok: false, error: 'Error guardando la cotización.' });
  }
});

app.post('/api/pqrsf', upload.array('documentos', MAX_FILES), (req, res) => {
  const tipo = trim(req.body.tipo || req.body['pqrs-tipo']).toLowerCase();
  const nombre = trim(req.body.nombre);
  const telefono = trim(req.body.telefono);
  const correo = trim(req.body.correo).toLowerCase();
  const descripcion = trim(req.body.descripcion);

  if (!tipo || !TIPOS_PQRSF.has(tipo)) {
    return res.status(400).json({ ok: false, error: 'Tipo de solicitud inválido.' });
  }
  if (!nombre) return res.status(400).json({ ok: false, error: 'El nombre es obligatorio.' });
  if (!correo || !isEmail(correo)) {
    return res.status(400).json({ ok: false, error: 'Correo electrónico inválido.' });
  }
  if (!descripcion) {
    return res.status(400).json({ ok: false, error: 'La descripción es obligatoria.' });
  }

  const files = Array.isArray(req.files) ? req.files : [];

  const insertPqrsf = db.prepare(`
    INSERT INTO pqrsf (tipo, nombre, telefono, correo, descripcion, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAdjunto = db.prepare(`
    INSERT INTO pqrsf_adjuntos (pqrsf_id, filename, mimetype, size_bytes, content)
    VALUES (?, ?, ?, ?, ?)
  `);

  let pqrsfId;
  db.exec('BEGIN');
  try {
    const info = insertPqrsf.run(
      tipo, nombre, telefono || null, correo, descripcion,
      clientIp(req), (req.headers['user-agent'] || '').slice(0, 500)
    );
    pqrsfId = toNum(info.lastInsertRowid);
    for (const f of files) {
      insertAdjunto.run(pqrsfId, f.originalname, f.mimetype, f.size, f.buffer);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[pqrsf]', err);
    return res.status(500).json({ ok: false, error: 'Error guardando la PQRSF.' });
  }

  const pqrsfData = {
    id: pqrsfId, tipo, nombre, telefono, correo, descripcion, ip: clientIp(req)
  };
  fireAndForget(mailer.sendPqrsfToAdemincol(pqrsfData, files), 'pqrsf-admin');
  fireAndForget(mailer.sendPqrsfAcknowledgement(pqrsfData), 'pqrsf-ack');

  return res.status(201).json({ ok: true, id: pqrsfId, adjuntos: files.length });
});

app.use((err, _req, res, _next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ ok: false, error: 'Archivo demasiado grande (máx. 10 MB por archivo).' });
  }
  if (err && err.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({ ok: false, error: `Máximo ${MAX_FILES} archivos.` });
  }
  console.error('[error]', err);
  res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
});

app.get('/api/admin/cotizaciones', requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT id, alcance, ubicacion, rut, correo, hse, otros, created_at
      FROM cotizaciones
     ORDER BY created_at DESC
     LIMIT 500
  `).all();
  res.json({ ok: true, count: rows.length, items: rows });
});

app.get('/api/admin/pqrsf', requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.tipo, p.nombre, p.telefono, p.correo, p.descripcion, p.created_at,
           (SELECT COUNT(*) FROM pqrsf_adjuntos a WHERE a.pqrsf_id = p.id) AS adjuntos
      FROM pqrsf p
     ORDER BY p.created_at DESC
     LIMIT 500
  `).all();
  res.json({ ok: true, count: rows.length, items: rows });
});

app.get('/api/admin/pqrsf/:id/adjuntos', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID inválido.' });
  const rows = db.prepare(`
    SELECT id, filename, mimetype, size_bytes, created_at
      FROM pqrsf_adjuntos
     WHERE pqrsf_id = ?
     ORDER BY id ASC
  `).all(id);
  res.json({ ok: true, count: rows.length, items: rows });
});

app.get('/api/admin/adjunto/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'ID inválido.' });
  const row = db.prepare(`
    SELECT filename, mimetype, content FROM pqrsf_adjuntos WHERE id = ?
  `).get(id);
  if (!row) return res.status(404).json({ ok: false, error: 'Adjunto no encontrado.' });
  res.setHeader('Content-Type', row.mimetype || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(row.filename)}"`);
  res.send(Buffer.from(row.content));
});

app.listen(PORT, () => {
  console.log(`Backend Ademincol escuchando en http://localhost:${PORT}`);
  console.log(`DB:    ${path.resolve(process.env.DB_PATH || path.join(__dirname, 'data.db'))}`);
  console.log(`Mail:  ${mailer.isConfigured() ? 'habilitado' : 'deshabilitado (SMTP no configurado)'}`);
});
