-- 002_suite_unified.sql: Extension del esquema para CRM y Contactos

-- ============================================================
-- CRM: Pipelines y Etapas de Venta
-- ============================================================
CREATE TABLE IF NOT EXISTS Pipeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Etapa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pipeline_id INTEGER NOT NULL REFERENCES Pipeline(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  creado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CRM: Oportunidades Comerciales (Deals)
-- ============================================================
CREATE TABLE IF NOT EXISTS Deal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  valor REAL NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'ARS',
  etapa_id INTEGER NOT NULL REFERENCES Etapa(id),
  cliente_id INTEGER REFERENCES Cliente(id) ON DELETE SET NULL,
  usuario_id INTEGER REFERENCES Usuario(id) ON DELETE SET NULL,
  probabilidad INTEGER DEFAULT 50,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'ganado', 'perdido')),
  fecha_cierre_esperada TEXT,
  notas TEXT,
  creado_el TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CRM / Contactos: Registro de Interacciones y Actividades
-- ============================================================
CREATE TABLE IF NOT EXISTS Interaccion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('llamada', 'reunion', 'whatsapp', 'email', 'nota', 'tarea')),
  deal_id INTEGER REFERENCES Deal(id) ON DELETE CASCADE,
  cliente_id INTEGER REFERENCES Cliente(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES Usuario(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  completada INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- Contactos: Entidad Unificada de Personas y Calidad de Datos
-- ============================================================
CREATE TABLE IF NOT EXISTS Persona (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellido TEXT,
  empresa TEXT,
  cargo TEXT,
  scoring INTEGER NOT NULL DEFAULT 50,
  estado_calidad TEXT NOT NULL DEFAULT 'util' CHECK (estado_calidad IN ('util', 'dudoso', 'inutil')),
  notas TEXT,
  creado_el TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Contactos: Canales de Comunicación asociados a Persona
-- ============================================================
CREATE TABLE IF NOT EXISTS ContactoCanal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  persona_id INTEGER NOT NULL REFERENCES Persona(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('telefono', 'whatsapp', 'email', 'instagram', 'linkedin', 'otro')),
  valor TEXT NOT NULL,
  es_principal INTEGER NOT NULL DEFAULT 0,
  verificado INTEGER NOT NULL DEFAULT 0,
  creado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Índices para Optimización de Consultas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_etapa_pipeline ON Etapa(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deal_etapa ON Deal(etapa_id);
CREATE INDEX IF NOT EXISTS idx_deal_cliente ON Deal(cliente_id);
CREATE INDEX IF NOT EXISTS idx_interaccion_deal ON Interaccion(deal_id);
CREATE INDEX IF NOT EXISTS idx_interaccion_cliente ON Interaccion(cliente_id);
CREATE INDEX IF NOT EXISTS idx_persona_uuid ON Persona(uuid);
CREATE INDEX IF NOT EXISTS idx_canal_persona ON ContactoCanal(persona_id);

-- ============================================================
-- Datos Iniciales / Semilla de Pipeline y Etapas Base
-- ============================================================
INSERT OR IGNORE INTO Pipeline (id, nombre, activo) VALUES (1, 'Pipeline Comercial Principal', 1);

INSERT OR IGNORE INTO Etapa (id, pipeline_id, nombre, orden, color) VALUES
  (1, 1, 'Lead', 1, '#3b82f6'),
  (2, 1, 'Calificado', 2, '#06b6d4'),
  (3, 1, 'Propuesta', 3, '#f59e0b'),
  (4, 1, 'Negociación', 4, '#8b5cf6'),
  (5, 1, 'Ganado', 5, '#10b981'),
  (6, 1, 'Perdido', 6, '#ef4444');
