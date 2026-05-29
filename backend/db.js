const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS cotizaciones (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    alcance      TEXT NOT NULL,
    ubicacion    TEXT,
    rut          TEXT,
    correo       TEXT,
    hse          TEXT,
    otros        TEXT,
    ip           TEXT,
    user_agent   TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pqrsf (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo         TEXT NOT NULL,
    nombre       TEXT NOT NULL,
    telefono     TEXT,
    correo       TEXT NOT NULL,
    descripcion  TEXT NOT NULL,
    ip           TEXT,
    user_agent   TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pqrsf_adjuntos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    pqrsf_id     INTEGER NOT NULL,
    filename     TEXT NOT NULL,
    mimetype     TEXT,
    size_bytes   INTEGER,
    content      BLOB NOT NULL,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (pqrsf_id) REFERENCES pqrsf(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_cotizaciones_created ON cotizaciones(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_pqrsf_created       ON pqrsf(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_adjuntos_pqrsf      ON pqrsf_adjuntos(pqrsf_id);
`);

function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
ensureColumn('cotizaciones', 'correo', 'TEXT');

module.exports = db;
