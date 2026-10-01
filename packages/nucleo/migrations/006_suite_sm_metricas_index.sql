-- 006_suite_sm_metricas_index.sql: Índices de rendimiento para retroalimentación histórica en sm_metricas y sm_propuestas

CREATE INDEX IF NOT EXISTS idx_sm_propuestas_publicado ON sm_propuestas(publicado_el);
CREATE INDEX IF NOT EXISTS idx_sm_metricas_registrado ON sm_metricas(registrado_el);
CREATE INDEX IF NOT EXISTS idx_sm_metricas_propuesta_fecha ON sm_metricas(propuesta_id, registrado_el);
