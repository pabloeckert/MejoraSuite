-- 005_suite_sm_defense.sql: Blindaje defensivo de sm_propuestas (hash_unico y nuevos estados)

PRAGMA foreign_keys=off;

CREATE TABLE IF NOT EXISTS sm_propuestas_defense (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  formato TEXT DEFAULT 'post',
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'pendiente_revision', 'aprobado', 'programado', 'congelado_por_timeout', 'publicado', 'error_sincronizacion', 'rechazado')),
  canal_id INTEGER REFERENCES sm_canales(id) ON DELETE SET NULL,
  hash_unico TEXT UNIQUE,
  programado_el TEXT,
  publicado_el TEXT,
  creado_el TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO sm_propuestas_defense (id, titulo, contenido, formato, estado, canal_id, programado_el, publicado_el, creado_el, actualizado_el)
SELECT id, titulo, contenido, formato, estado, canal_id, programado_el, publicado_el, creado_el, actualizado_el
FROM sm_propuestas;

DROP TABLE sm_propuestas;

ALTER TABLE sm_propuestas_defense RENAME TO sm_propuestas;

CREATE INDEX IF NOT EXISTS idx_sm_propuestas_estado ON sm_propuestas(estado);
CREATE INDEX IF NOT EXISTS idx_sm_propuestas_canal ON sm_propuestas(canal_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sm_propuestas_hash ON sm_propuestas(hash_unico);

PRAGMA foreign_keys=on;
