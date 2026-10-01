-- 004_suite_ws.sql: Migracion para WhatsApp Engine (MejoraWS) y persistencia SQLite

-- ============================================================
-- Sesiones de WhatsApp
-- ============================================================
CREATE TABLE IF NOT EXISTS ws_sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'desconectado',
  qr_code TEXT,
  phone TEXT,
  creado_el TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Carpetas / Listas de WhatsApp
-- ============================================================
CREATE TABLE IF NOT EXISTS ws_carpetas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#25D366',
  creado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Miembros de Carpetas WhatsApp (referencia a Persona de Contactos)
-- ============================================================
CREATE TABLE IF NOT EXISTS ws_miembros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  carpeta_id INTEGER NOT NULL REFERENCES ws_carpetas(id) ON DELETE CASCADE,
  persona_id INTEGER REFERENCES Persona(id) ON DELETE SET NULL,
  telefono TEXT NOT NULL,
  agregado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Indices para Optimizacion
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ws_sesiones_name ON ws_sesiones(session_name);
CREATE INDEX IF NOT EXISTS idx_ws_miembros_carpeta ON ws_miembros(carpeta_id);
CREATE INDEX IF NOT EXISTS idx_ws_miembros_persona ON ws_miembros(persona_id);
CREATE INDEX IF NOT EXISTS idx_ws_miembros_telefono ON ws_miembros(telefono);

-- ============================================================
-- Datos Semilla Iniciales
-- ============================================================
INSERT OR IGNORE INTO ws_sesiones (id, session_name, status) VALUES (1, 'default', 'desconectado');
INSERT OR IGNORE INTO ws_carpetas (id, nombre, color) VALUES (1, 'General', '#25D366');
