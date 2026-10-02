-- ==============================================================================
-- MEJORA CONTINUA - SEMILLAS DE ORO (COLD START)
-- Inyección idempotente de los 3 posts históricos con mayor conversión B2B
-- Ubicación: c:\github\MejoraSuite\scripts\semillas_oro.sql
-- ==============================================================================

BEGIN TRANSACTION;

-- 1. Asegurar tablas base si no existen
CREATE TABLE IF NOT EXISTS sm_canales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plataforma TEXT NOT NULL UNIQUE,
  activo INTEGER NOT NULL DEFAULT 1,
  cuenta_id TEXT,
  creado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sm_propuestas (
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

CREATE TABLE IF NOT EXISTS sm_metricas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  propuesta_id INTEGER NOT NULL REFERENCES sm_propuestas(id) ON DELETE CASCADE,
  alcance INTEGER NOT NULL DEFAULT 0,
  interacciones INTEGER NOT NULL DEFAULT 0,
  clics INTEGER NOT NULL DEFAULT 0,
  compartidos INTEGER NOT NULL DEFAULT 0,
  registrado_el TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Canales base
INSERT OR IGNORE INTO sm_canales (id, plataforma, activo) VALUES
  (1, 'instagram', 1),
  (2, 'facebook', 1),
  (3, 'linkedin', 1);

-- ------------------------------------------------------------------------------
-- SEMILLA 1 (Mayor Conversión Histórica: ~7.54%)
-- Perfil: Emprendedor Saturado / Líder Comercial - Foco en Trazabilidad y Datos
-- ------------------------------------------------------------------------------
INSERT OR REPLACE INTO sm_propuestas (
  id,
  titulo,
  contenido,
  formato,
  estado,
  canal_id,
  hash_unico,
  publicado_el,
  creado_el,
  actualizado_el
) VALUES (
  101,
  'No vendés poco. Vendés a ciegas.',
  '{"hook":"No vendés poco. Vendés a ciegas.","body":"Si hoy no podés responder cuánto te deja realmente cada cliente ni en qué etapa exacta de tu embudo se están enfriando las oportunidades, tu problema no es de demanda: es de trazabilidad.\\n\\nUn negocio no se vuelve predecible trayendo más leads al desorden, sino sabiendo con precisión quirúrgica qué pasa con cada conversación que ya entró. Cuando no medís la conversión real, cada decisión comercial es una apuesta a ciegas y el esfuerzo del equipo se diluye en intuiciones.","cta":"Si querés dejar de adivinar y empezar a tomar decisiones comerciales sobre números reales, ya sabés dónde encontrarme."}',
  'post',
  'publicado',
  3,
  'hash_semilla_oro_101',
  datetime('now', '-2 days'),
  datetime('now', '-3 days'),
  datetime('now')
);

INSERT OR REPLACE INTO sm_metricas (
  id,
  propuesta_id,
  alcance,
  interacciones,
  clics,
  compartidos,
  registrado_el
) VALUES (
  101,
  101,
  3450,
  290,
  260,
  38,
  datetime('now', '-2 days')
);

-- ------------------------------------------------------------------------------
-- SEMILLA 2 (Segunda Mayor Conversión: ~7.16%)
-- Perfil: Inflación Operativa - Líder que necesita validar escala y delegar
-- ------------------------------------------------------------------------------
INSERT OR REPLACE INTO sm_propuestas (
  id,
  titulo,
  contenido,
  formato,
  estado,
  canal_id,
  hash_unico,
  publicado_el,
  creado_el,
  actualizado_el
) VALUES (
  102,
  'Facturás más y trabajás peor. Eso no es crecimiento.',
  '{"hook":"Facturás más que el año pasado y trabajás peor que nunca. Eso no es crecimiento: es inflación operativa.","body":"Cuando el volumen de ventas sube pero la tranquilidad y la rentabilidad bajan, el problema no es el mercado ni tu equipo. Es que seguís operando con la lógica de un negocio chico cuando la escala ya te exige profesionalización.\\n\\nCrecer no es meter más horas tuyas adentro de la máquina para apagar incendios; es diseñar los engranajes para que la estructura funcione con fluidez sin depender de que vos estés en cada detalle. Ordenar no es frenar: es la única forma de sostener el avance.","cta":"No tenés por qué seguir decidiendo en soledad ni esperando al colapso para ordenar tu operación. Escribime y revisamos dónde está trabado el flujo."}',
  'post',
  'publicado',
  3,
  'hash_semilla_oro_102',
  datetime('now', '-4 days'),
  datetime('now', '-5 days'),
  datetime('now')
);

INSERT OR REPLACE INTO sm_metricas (
  id,
  propuesta_id,
  alcance,
  interacciones,
  clics,
  compartidos,
  registrado_el
) VALUES (
  102,
  102,
  4120,
  360,
  295,
  58,
  datetime('now', '-4 days')
);

-- ------------------------------------------------------------------------------
-- SEMILLA 3 (Tercera Mayor Conversión: ~6.46%)
-- Perfil: Arquitectura Operativa B2B - Desconexión entre WhatsApp, CRM y Ventas
-- ------------------------------------------------------------------------------
INSERT OR REPLACE INTO sm_propuestas (
  id,
  titulo,
  contenido,
  formato,
  estado,
  canal_id,
  hash_unico,
  publicado_el,
  creado_el,
  actualizado_el
) VALUES (
  103,
  'Tenés WhatsApp, CRM y facturación. Ninguno se habla.',
  '{"hook":"Tenés WhatsApp, CRM y facturación. El problema es que ninguno de los tres se habla con el otro.","body":"Sumar software sin conectar procesos no moderniza tu empresa: multiplica el caos. Cuando el cliente te escribe por un canal, el presupuesto viaja por otro y la entrega se pierde en una planilla, el cuello de botella no es la tecnología, es la falta de arquitectura operativa.\\n\\nLa rentabilidad se filtra en las horas que tu equipo pasa haciendo de puente humano entre sistemas que deberían entenderse solos. Antes de sumar una herramienta más, hay que ordenar cómo fluye la información.","cta":"Si tu estructura hoy es un cuello de botella que te impide dirigir, ya sabés dónde encontrarme. Escribime y empezamos a destrabar esto."}',
  'post',
  'publicado',
  1,
  'hash_semilla_oro_103',
  datetime('now', '-7 days'),
  datetime('now', '-8 days'),
  datetime('now')
);

INSERT OR REPLACE INTO sm_metricas (
  id,
  propuesta_id,
  alcance,
  interacciones,
  clics,
  compartidos,
  registrado_el
) VALUES (
  103,
  103,
  3840,
  312,
  248,
  45,
  datetime('now', '-7 days')
);

COMMIT;
