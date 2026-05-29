const nodemailer = require('nodemailer');

const MAIL_ENABLED = String(process.env.MAIL_ENABLED || 'true').toLowerCase() !== 'false';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || 'Ademincol <no-reply@ademincol.com.co>';
const MAIL_TO_COTIZACION = process.env.MAIL_TO_COTIZACION || 'comercial1@ademincol.com.co';
const MAIL_TO_PQRSF = process.env.MAIL_TO_PQRSF || 'pqrsf@ademincol.com.co';
const MAIL_BCC = (process.env.MAIL_BCC || '').trim();

let transporter = null;

function isConfigured() {
  return Boolean(MAIL_ENABLED && SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function getTransporter() {
  if (!isConfigured()) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return transporter;
}

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function row(label, value) {
  const v = value === null || value === undefined || value === '' ? '—' : esc(value);
  return `<tr><td style="padding:6px 12px;background:#f5f5f5;font-weight:600;border-bottom:1px solid #eee">${label}</td><td style="padding:6px 12px;border-bottom:1px solid #eee">${v}</td></tr>`;
}

function wrap(title, bodyRows, footer) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222;margin:0;padding:24px;background:#fff">
  <div style="max-width:640px;margin:auto;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden">
    <div style="background:#1E3056;color:#fff;padding:14px 20px;font-size:18px;font-weight:600">${esc(title)}</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${bodyRows}</table>
    ${footer ? `<div style="padding:14px 20px;color:#666;font-size:12px;border-top:1px solid #eee">${footer}</div>` : ''}
  </div></body></html>`;
}

async function send(opts) {
  const t = getTransporter();
  if (!t) {
    console.log('[mailer] omitido (SMTP no configurado o MAIL_ENABLED=false):', opts.subject);
    return { skipped: true };
  }
  try {
    const info = await t.sendMail({ from: MAIL_FROM, bcc: MAIL_BCC || undefined, ...opts });
    console.log('[mailer] enviado:', opts.subject, '→', opts.to, 'id:', info.messageId);
    return { sent: true, id: info.messageId };
  } catch (err) {
    console.error('[mailer] error enviando "' + opts.subject + '":', err.message);
    return { sent: false, error: err.message };
  }
}

async function sendCotizacionToAdemincol(data) {
  const rows =
    row('ID interno', data.id) +
    row('Correo del solicitante', data.correo) +
    row('Alcance del servicio', data.alcance) +
    row('Ubicación', data.ubicacion) +
    row('RUT', data.rut) +
    row('¿Requiere apoyo HSE?', data.hse) +
    row('Otros requerimientos', data.otros) +
    row('IP origen', data.ip) +
    row('Fecha', new Date().toISOString());

  const text = [
    `Nueva solicitud de cotización (ID ${data.id})`,
    '',
    `Correo: ${data.correo || '—'}`,
    `Alcance: ${data.alcance || '—'}`,
    `Ubicación: ${data.ubicacion || '—'}`,
    `RUT: ${data.rut || '—'}`,
    `HSE: ${data.hse || '—'}`,
    `Otros: ${data.otros || '—'}`,
    `IP: ${data.ip || '—'}`
  ].join('\n');

  return send({
    to: MAIL_TO_COTIZACION,
    replyTo: data.correo,
    subject: `Nueva cotización #${data.id} — ${(data.alcance || '').slice(0, 60)}`,
    text,
    html: wrap('Nueva solicitud de cotización', rows, 'Mensaje generado automáticamente desde el sitio web.')
  });
}

async function sendCotizacionAcknowledgement(data) {
  if (!data.correo) return { skipped: true };

  const rows =
    row('Solicitud n.º', data.id) +
    row('Alcance', data.alcance) +
    row('Ubicación', data.ubicacion) +
    row('Recibido el', new Date().toLocaleString('es-CO'));

  const intro = `
    <tr><td colspan="2" style="padding:16px 20px;font-size:14px;line-height:1.5">
      Hemos recibido su solicitud de cotización.<br><br>
      Nuestro equipo comercial revisará los detalles y se pondrá en contacto con
      usted a través de este correo electrónico en el menor tiempo posible.
    </td></tr>`;

  const text = [
    'Hemos recibido su solicitud de cotización.',
    '',
    `   Solicitud n.º: ${data.id}`,
    `   Alcance: ${data.alcance}`,
    `   Ubicación: ${data.ubicacion}`,
    `   Recibido: ${new Date().toLocaleString('es-CO')}`,
    '',
    'Nuestro equipo comercial revisará los detalles y se pondrá en contacto con usted a través de este correo en el menor tiempo posible.',
    '',
    'Cordialmente,',
    'Ademincol S.A.'
  ].join('\n');

  return send({
    to: data.correo,
    subject: `Solicitud de cotización #${data.id} recibida — Ademincol S.A.`,
    text,
    html: wrap('Solicitud de cotización recibida', intro + rows,
      'Este es un mensaje automático. Para consultas adicionales escriba a comercial1@ademincol.com.co.')
  });
}

async function sendPqrsfToAdemincol(data, attachments) {
  const rows =
    row('Radicado interno', data.id) +
    row('Tipo de solicitud', data.tipo) +
    row('Nombre', data.nombre) +
    row('Correo del solicitante', data.correo) +
    row('Teléfono', data.telefono) +
    row('Descripción', data.descripcion) +
    row('Adjuntos', (attachments || []).length) +
    row('IP origen', data.ip) +
    row('Fecha', new Date().toISOString());

  const text = [
    `Nueva PQRSF #${data.id} (${data.tipo})`,
    '',
    `Nombre: ${data.nombre}`,
    `Correo: ${data.correo}`,
    `Teléfono: ${data.telefono || '—'}`,
    `Adjuntos: ${(attachments || []).length}`,
    '',
    'Descripción:',
    data.descripcion
  ].join('\n');

  const mailAttachments = (attachments || []).map((f) => ({
    filename: f.originalname,
    content: f.buffer,
    contentType: f.mimetype
  }));

  return send({
    to: MAIL_TO_PQRSF,
    replyTo: data.correo,
    subject: `PQRSF #${data.id} (${data.tipo}) — ${data.nombre}`,
    text,
    html: wrap(`Nueva PQRSF — ${data.tipo}`, rows, 'Mensaje generado automáticamente desde el sitio web.'),
    attachments: mailAttachments
  });
}

async function sendPqrsfAcknowledgement(data) {
  if (!data.correo) return { skipped: true };

  const rows =
    row('Radicado', data.id) +
    row('Tipo de solicitud', data.tipo) +
    row('Recibido el', new Date().toLocaleString('es-CO'));

  const intro = `
    <tr><td colspan="2" style="padding:16px 20px;font-size:14px;line-height:1.5">
      Estimado(a) <strong>${esc(data.nombre)}</strong>,<br><br>
      Hemos recibido su solicitud y le asignamos el siguiente número de radicado.
      Nuestro equipo le dará respuesta en los términos definidos por la normativa
      colombiana para PQRSF.
    </td></tr>`;

  const text = [
    `Estimado(a) ${data.nombre},`,
    '',
    'Hemos recibido su solicitud y le asignamos el siguiente número de radicado:',
    '',
    `   Radicado: ${data.id}`,
    `   Tipo: ${data.tipo}`,
    `   Recibido: ${new Date().toLocaleString('es-CO')}`,
    '',
    'Nuestro equipo le dará respuesta en los términos definidos por la normativa colombiana para PQRSF.',
    '',
    'Cordialmente,',
    'Ademincol S.A.'
  ].join('\n');

  return send({
    to: data.correo,
    subject: `Acuse de recibo PQRSF #${data.id} — Ademincol S.A.`,
    text,
    html: wrap('Acuse de recibo — PQRSF', intro + rows,
      'Este es un mensaje automático. Por favor no responda a este correo; para consultas escriba a pqrsf@ademincol.com.co.')
  });
}

module.exports = {
  isConfigured,
  sendCotizacionToAdemincol,
  sendCotizacionAcknowledgement,
  sendPqrsfToAdemincol,
  sendPqrsfAcknowledgement
};
