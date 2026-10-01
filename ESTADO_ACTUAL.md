# ESTADO ACTUAL DEL ECOSISTEMA MEJORASUITE

**Fecha de Cierre de Jornada:** 30 de Septiembre de 2026  
**Entorno de Trabajo:** `C:\github\MejoraSuite`  
**Estado General:** Monorepo Consolidado, Soberano y Estable  

---

## 1. Hito Alcanzado: Consolidación Monorepo (5/5 Paquetes)

El monorepo opera de forma unificada bajo **Turborepo** y **NPM Workspaces**, compilando el 100% de sus componentes sin errores en un pipeline continuo (~45 segundos):

1. **`@mejora/nucleo` (v1.0.0):** Motor de base de datos transaccional local basado en `better-sqlite3`. Exporta esquemas tipados en TypeScript, gestor automático de migraciones y funciones CRUD unificadas.
2. **`@mejora/crm` (v1.0.0):** Aplicación de ventas, pipeline comercial (Kanban), gestión de clientes y deals, adaptada para leer y escribir directamente en SQLite.
3. **`@mejora/contactos` (v1.0.0):** Truth engine de identidad, deduplicación de listas y normalización de contactos, con bypass de IndexedDB y persistencia en la tabla `Persona`.
4. **`@mejora/sm` (v1.0.0):** Plataforma de marketing de contenidos, bóveda de conocimiento, propuestas editoriales y calendario, con bypass de Supabase Cloud para lectura y guardado en SQLite local.
5. **`@mejora/shell` (v1.0.0):** Aplicación de escritorio gobernada por **Electron 31**, que actúa como contenedor único, puente IPC (`preload.cjs`), barra de telemetría y selector dinámico de vistas.

---

## 2. Persistencia Local Unificada: SQLite `@mejora/nucleo` (16 Tablas)

La base de datos SQLite soberana reside en `%APPDATA%\@mejora\shell\nucleo.db` (en modo WAL), con 3 migraciones ejecutadas secuencialmente:

- **Migración 001 (`001_initial_schema.sql`):**
  - `Usuario`
  - `Negocio`
  - `Item`
  - `Cliente`
  - `Transaccion`
  - `TurnoCaja`
  - `MovimientoCaja`
- **Migración 002 (`002_suite_unified.sql`):**
  - `Pipeline` (comercial)
  - `Etapa` (embudo de ventas)
  - `Deal` (oportunidades vinculadas a clientes)
  - `Interaccion` (registro de llamadas, reuniones, notas)
  - `Persona` (identidad unificada de contactos deduplicados)
  - `ContactoCanal` (múltiples canales por persona: teléfono, WA, email, etc.)
- **Migración 003 (`003_suite_sm.sql`):**
  - `sm_canales` (plataformas de publicación: Instagram, Facebook, LinkedIn)
  - `sm_propuestas` (piezas de contenido y estado de publicación)
  - `sm_metricas` (alcance, interacciones, clics y compartidos)

**Total:** 16 tablas operativas verificadas en el arranque del Proceso Principal de Electron.

---

## 3. Desconexión Cloud y Puentes IPC

Se ha eliminado la fragilidad de depender de servicios cloud externos (Supabase GoTrue, PostgREST Cloud, IndexedDB del navegador) para la operativa local de escritorio:

- **Bypass de Autenticación:** Las aplicaciones reconocen la inyección de `window.suite.db` y auto-autentican una sesión local de administrador, eliminando bloqueos en pantallas de login.
- **Canales IPC Tipados (`preload.cjs`):**
  - `window.suite.db.crm.*`: `getDeals`, `createDeal`, `getPipelines`, `getEtapas`, `getClientes`, `createCliente`.
  - `window.suite.db.contactos.*`: `getPersonas`, `createPersona`, `getClientes`, `createCliente`.
  - `window.suite.db.sm.*`: `getPropuestas`, `createPropuesta`, `getCanales`, `getMetricas`.
- **Enrutamiento Interno en Shell:** `apps/shell/src/App.tsx` y `Header.tsx` permiten alternar instantáneamente entre el Hub Central, CRM, Contactos y Social Media manteniendo el estado y con retorno con un solo clic.

---

## 4. Próximo Paso (Pendiente)

### Integración de MejoraWS (WhatsApp Engine)

Con CRM, Contactos y Social Media unificados en React 18 + SQLite, el paso pendiente para completar la suite es integrar **MejoraWS**:

1. **Aislamiento del Motor Baileys:** Extraer la lógica de conexión de WhatsApp (`makeWASocket`, autenticación local en disco `userData/auth` y el servidor HTTP Bridge en `127.0.0.1:4180`) para que corra como un servicio de fondo orquestado por Electron Main.
2. **Interfaz Nativa en React 18:** Construir un panel liviano de WhatsApp dentro de `apps/shell` que se conecte al stream SSE del bridge (`/events`) para mostrar el QR, estado de conexión y disparo de campañas, evitando el choque de dependencias con React 19 / Tailwind v4 del repo original.
3. **Persistencia de Campañas en SQLite:** Migrar el almacenamiento de `lowdb` (`data.json`) hacia una nueva migración `004_suite_ws.sql` en `@mejora/nucleo`, asociando los envíos directamente a las identidades de `Persona` y `ContactoCanal`.
