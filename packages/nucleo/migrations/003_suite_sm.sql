-- 003_suite_sm.sql: Esquema para Social Media (MejoraSM)

-- ============================================================
-- Canales / Plataformas de Publicacion
-- ============================================================
CREATE TABLE IF NOT EXISTS sm_canales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plataforma TEXT NOT NULL UNIQUE,
  activo INTEGER NOT NULL DEFAULT 1,
  cuenta_id TEXT,
  creado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Propuestas Editoriales y Publicaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS sm_propuestas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  formato TEXT DEFAULT 'post',
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'aprobado', 'programado', 'publicado', 'rechazado')),
  canal_id INTEGER REFERENCES sm_canales(id) ON DELETE SET NULL,
  programado_el TEXT,
  publicado_el TEXT,
  creado_el TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Metricas de Rendimiento
-- ============================================================
CREATE TABLE IF NOT EXISTS sm_metricas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  propuesta_id INTEGER NOT NULL REFERENCES sm_propuestas(id) ON DELETE CASCADE,
  alcance INTEGER NOT NULL DEFAULT 0,
  interacciones INTEGER NOT NULL DEFAULT 0,
  clics INTEGER NOT NULL DEFAULT 0,
  compartidos INTEGER NOT NULL DEFAULT 0,
  registrado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Indices para Optimizacion
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sm_propuestas_estado ON sm_propuestas(estado);
CREATE INDEX IF NOT EXISTS idx_sm_propuestas_canal ON sm_propuestas(canal_id);
CREATE INDEX IF NOT EXISTS idx_sm_metricas_propuesta ON sm_metricas(propuesta_id);

-- ============================================================
-- Canales Iniciales Semilla
-- ============================================================
INSERT OR IGNORE INTO sm_canales (id, plataforma, activo) VALUES
  (1, 'instagram', 1),
  (2, 'facebook', 1),
  (3, 'linkedin', 1);

-- ============================================================
-- Propuesta de Ejemplo Inicial Semilla
-- ============================================================
INSERT OR IGNORE INTO sm_propuestas (id, titulo, contenido, formato, estado, canal_id) VALUES
  (1, 'Claridad Estratégica vs Saturación', 'No estás saturado por trabajar mucho, sino por trabajar sin claridad. Tu problema no es el tiempo, es el foco.', 'post', 'publicado', 1);

INSERT OR IGNORE INTO sm_metricas (id, propuesta_id, alcance, interacciones, clics, compartidos) VALUES
  (1, 1, 1250, 84, 18, 5);
