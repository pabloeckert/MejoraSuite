# INFORME DE ESTADO — Suite Mejora Continua
**Fecha:** 15 de septiembre de 2026
**Tipo:** Informe de avance de arquitectura e integración. NO es la documentación de estructura final — esa se emite cuando el proyecto esté construido y verificado. Este documento existe para dar visibilidad completa del punto exacto en que está el trabajo hoy.

---

## 0. Resumen ejecutivo

El proyecto es la construcción de una suite integrada de 9-10 aplicaciones de negocio bajo la marca Mejora Continua, hoy mayormente aisladas entre sí, con **MejoraContactos** como fuente única de datos de contacto y **MejoraSuite** evolucionando de simple lanzador a panel de orquestación real.

**Estado general: 1 de 9 aplicaciones migrada a la arquitectura nueva. 1 bloqueo de seguridad crítico sin resolver, con la migración de la segunda aplicación pausada hasta que se cierre.**

---

## 1. Alcance confirmado de la suite

| # | Proyecto | Rol | Estado de integración |
|---|---|---|---|
| 1 | **MejoraContactos** | Fuente única de verdad de contactos | ✅ Migrado — infraestructura lista |
| 2 | **MejoraCRM** | Gestión comercial | 🔍 Diagnosticado, migración detenida por bloqueo de seguridad |
| 3 | **MejoraWS** | Canal WhatsApp | ⬜ Sin iniciar |
| 4 | **MejoraSM** | Redes sociales | ⬜ Sin iniciar |
| 5 | **MejoraDiagnostico** | Captura de leads | ⬜ Sin iniciar |
| 6 | **MejoraSuite** | Orquestador / panel de control | ⬜ Sin iniciar (hoy solo lanza 3 apps) |
| 7 | **MejoraIdentidad** | Fuente de verdad de marca | ✅ Ya funciona de forma autónoma (SM la consume) |
| 8 | **Mejoraok** | Sitio web público | ⬜ Sin iniciar integración |
| 9 | **MejoraApp** | PWA de cliente final | ⬜ Pendiente de análisis de vínculo (decisión tomada: entra a la suite) |
| 10 | **MejoraDecisiones** | Panel de análisis político | ✅ Consolidado (absorbió lo rescatable de MejoraMasterVision, que se descarta como proyecto propio) |

**Fuera de la suite, sin acción requerida:** MejoraRedmi14c, MejoraTCL40se, MejoraPC, MejoraStremio (personales), MejoraNucleo (plantilla para clientes nuevos, otro propósito).

---

## 2. Trabajo completado — detalle técnico

### 2.1 MejoraContactos → Supabase (CERRADO)
- Base real identificada: `motor-contactos` (pipeline Python + SQLite local), con historial auditable de fusión/deduplicación.
- Se agregó `persona_id` (UUID v4 estable, no recalculable) con regla de supervivencia al fusionar clusters: gana el lado con más `raw_records`; empate → el más antiguo.
- Se agregó `updated_at` a nivel de contacto final, para permitir sincronización incremental.
- Se creó la tabla `contactos_finales` en el proyecto Supabase ya conectado al repo, con sincronización (upsert) automática después de cada corrida del pipeline — diseñada fail-soft (si no hay credenciales cargadas, no rompe nada, simplemente no sincroniza).
- Seguridad: Row Level Security activado, más una Edge Function (`contactos-api`) que valida acceso por API key (hash guardado, nunca la key en texto plano), pensada para un key distinto por sistema consumidor (CRM, WhatsApp).
- Validación: 238/238 tests pasando, sin alterar el comportamiento del pipeline de dedup existente. CI y deploy verdes en producción.
- **Decisión de negocio clave:** la tabla arranca **vacía a propósito**. Los 8.590 contactos procesados durante el desarrollo eran datos de prueba, no la base real — la carga de datos reales queda como paso futuro, deliberadamente separado de la construcción de la infraestructura.

### 2.2 MejoraDecisiones vs. MejoraMasterVision (CERRADO)
- Auditoría comparativa exhaustiva de ambos repos (código real, no solo README).
- Hallazgo relevante: el propio README de MejoraDecisiones tenía la tabla de estado de módulos invertida respecto al código real.
- Se rescató y mergeó una rama abandonada de alto valor (`claude/cto-analysis-framework-E583b`): integración real a APIs públicas argentinas (BCRA, DolarAPI, INDEC/datos.gob.ar), motor de Nash extraído a librería propia con 52 tests.
- En el proceso de merge se encontraron y corrigieron dos problemas adicionales no previstos: dependencias de lint nunca instaladas (causa real de 4 fallos de CI históricos) y una incompatibilidad de lockfile (generado con npm 11 local vs. npm 10 del runner de CI).
- README corregido: link de producción y tabla de estado de módulos ajustados a la realidad verificada del código.
- Deploy en producción confirmado funcionando: `https://pabloeckert.github.io/MejoraDecisiones/`
- MejoraMasterVision se descarta como proyecto propio; su único componente de valor no redundante (chat con IA + memoria vía Cloudflare Worker) queda pendiente de integrarse dentro de MejoraDecisiones como función de "asesor IA".

---

## 3. BLOQUEO ACTIVO — Prioridad máxima, sin resolver

### 🔴 Seguridad — `service_role` key de Supabase expuesta (MejoraCRM)
- Una sesión de trabajo anterior (15 de agosto de 2026) dejó documentado que una `service_role` key real de Supabase y contraseñas en texto plano estuvieron commiteadas en el repo público de MejoraCRM.
- Se corrigió el código (el archivo que las contenía ya no existe en el árbol actual), **pero la rotación de la key en el Supabase Dashboard quedó pendiente y nunca se confirmó como hecha.**
- **Riesgo mientras siga así:** al ser un repo público, si la key permanece en el historial de git, cualquiera que la haya visto tiene acceso de lectura/escritura total a la base de producción de MejoraCRM, sin pasar por ninguna regla de seguridad (RLS).
- **Este documento no puede confirmar si ya se resolvió** — es la primera acción que debe confirmarse, verbalmente o con evidencia, antes de retomar cualquier trabajo de integración sobre MejoraCRM.

### 🟡 Dato pendiente de vaciar (MejoraCRM)
- La misma sesión de agosto dejó un `TRUNCATE` de datos reales pendiente en MejoraCRM (sí se ejecutó en MejoraWS, no en MejoraCRM, por falta de credenciales en ese momento).
- No hay confirmación de si la tabla `clients` de producción tiene datos reales cargados hoy.

---

## 4. Diagnóstico completo de MejoraCRM (hecho, a la espera del bloqueo de seguridad para avanzar)

- Contactos viven en tabla propia `clients` (Postgres/Supabase, proyecto separado del de MejoraContactos), evolucionada en 4 migraciones.
- **Hallazgo estructural importante: MejoraCRM es un producto SaaS multi-tenant real**, no una herramienta interna de un solo negocio — está en producción comercial (`crm.mejoraok.com`) con arquitectura de organizaciones (`organization_id`) y RLS por tenant. Esto significa que la integración con `contactos_finales` debe diseñarse específicamente "hacia la organización de Mejora Continua", no como mapeo genérico de toda la tabla.
- El modelo de datos de CRM es más rico de lo anticipado: existe un sistema completo de `interactions` (con medio, resultado, negociación, motivo de pérdida, presupuestos con líneas de producto) que ya cubre gran parte de lo que se había identificado como "hueco" en el diagnóstico de MejoraContactos.
- Buena noticia técnica: el código ya identifica clientes por UUID estable en el 100% de los casos — no hay que introducir un concepto de identidad nuevo, solo decidir el origen del UUID.
- Punto débil identificado: la detección de duplicados en la importación manual de CSV es un match de texto simple (nombre o whatsapp exacto), sin la normalización que sí tiene el motor de dedup de MejoraContactos.

### Decisiones de diseño pendientes (no resueltas, a definir antes de tocar código):
1. `persona_id` en MejoraCRM: ¿columna nueva referenciando `contactos_finales` (recomendado, menos invasivo) o reemplazo directo de `clients.id`?
2. Dirección de la sincronización: ¿de una sola vía (MejoraContactos → MejoraCRM) o de doble vía (un vendedor puede cargar un cliente nuevo directo en el CRM y que viaje de vuelta)?
3. Futuro de la importación CSV manual: ¿se deprecia en favor del flujo único por MejoraContactos, o queda como vía alternativa?

---

## 5. Visión de UX/UI y experiencia — principios que rigen el diseño de la suite

Aunque el desarrollo de interfaz todavía no arrancó en esta etapa (el trabajo actual es 100% de datos e infraestructura), estos son los principios acordados que van a regir el diseño cuando llegue esa etapa, para que quede registrado desde ahora:

- **Simplicidad en superficie, potencia por debajo** — el mismo criterio que ya define a MejoraCRM ("mega CRM inteligente, pero con visión minimalista y lenguaje sencillo") se extiende como estándar a toda la suite.
- **Una sola fuente de verdad, múltiples puntos de entrada** — el usuario no debería notar que hay 9 sistemas distintos; cada app se siente autónoma en su uso diario, pero los datos fluyen sin fricción entre todas.
- **MejoraSuite como panel único de estado** — no solo lanzador de apps, sino el lugar donde en una sola pantalla se ve qué está pasando en todo el ecosistema (últimos leads, alertas de CRM, estado de campañas) y desde donde se puede actuar.
- **Nada se pierde, nada se duplica** — la razón de fondo detrás de la arquitectura de `persona_id`/`contactos_finales`: evitar que el mismo contacto exista distinto en cada sistema.

---

## 6. Próximos pasos, en orden

1. **Confirmar la rotación de la `service_role` key de MejoraCRM** (bloqueante — nada de integración avanza hasta esto).
2. Confirmar si hay datos reales en `clients` de MejoraCRM hoy, y si corresponde vaciarlos.
3. Resolver las 3 decisiones de diseño pendientes de MejoraCRM (sección 4).
4. Ejecutar la migración técnica de MejoraCRM hacia `persona_id`/`contactos_finales`.
5. Repetir el ciclo de diagnóstico + migración para MejoraWS, luego MejoraSM, luego MejoraDiagnostico.
6. Construir el canal de eventos compartido entre aplicaciones.
7. Evolucionar MejoraSuite de lanzador a panel de control real.
8. Recién entonces: análisis de integración de MejoraApp, y diseño de interfaz siguiendo los principios de la sección 5.

---

*Este informe se actualiza a medida que se cierran etapas. La estructura final del proyecto (arquitectura completa, diagramas, y documentación de cara a mantenimiento futuro) se emite como documento separado una vez completado y verificado el trabajo de integración.*
