# ESTADO ACTUAL DEL ECOSISTEMA MEJORASUITE

**Fecha de Cierre:** 2 de Octubre de 2026  
**Entorno de Trabajo:** `C:\github\MejoraSuite`  
**Estado General:** Monorepo Consolidado, Soberano, Estable, Fricción Cero y con ADN Ganador (Semillas de Oro) Operativo  

---

## 1. Hito Alcanzado: Consolidación Monorepo (5/5 Paquetes)

El monorepo opera de forma unificada bajo **Turborepo** y **NPM Workspaces**, compilando el 100% de sus componentes sin errores en un pipeline continuo:

1. **`@mejora/nucleo` (v1.0.0):** Motor de base de datos transaccional local basado en `better-sqlite3`. Exporta esquemas tipados en TypeScript, gestor automático de migraciones y funciones CRUD unificadas (incluyendo CRM, Contactos, Social Media y WhatsApp).
2. **`@mejora/crm` (v1.0.0):** Aplicación de ventas, pipeline comercial (Kanban), gestión de clientes y deals, adaptada para leer y escribir directamente en SQLite.
3. **`@mejora/contactos` (v1.0.0):** Truth engine de identidad, deduplicación de listas y normalización de contactos, con bypass de IndexedDB y persistencia en la tabla `Persona`.
4. **`@mejora/sm` (v1.0.0):** Plataforma de marketing de contenidos, bóveda de conocimiento, propuestas editoriales y calendario, con bypass de Supabase Cloud para lectura y guardado en SQLite local.
5. **`@mejora/shell` (v1.0.0):** Aplicación de escritorio gobernada por **Electron 31**, que actúa como contenedor único, puente IPC (`preload.cjs`), barra de telemetría, selector dinámico de vistas y orquestador del motor de WhatsApp (`wa-engine`).

---

## 2. Persistencia Local Unificada: SQLite `@mejora/nucleo` (19 Tablas)

La base de datos SQLite soberana reside en `%APPDATA%\@mejora\shell\nucleo.db` (en modo WAL), con 4 migraciones ejecutadas secuencialmente:

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
- **Migración 004 (`004_suite_ws.sql`):**
  - `ws_sesiones` (control de estado de sesión, QR y teléfono vinculado)
  - `ws_carpetas` (agrupamiento y segmentación de listas de mensajería)
  - `ws_miembros` (relación entre carpetas y la tabla `Persona` de Contactos)

**Total:** 19 tablas operativas verificadas en el arranque del Proceso Principal de Electron.

---

## 3. Desconexión Cloud y Puentes IPC

Se ha eliminado la fragilidad de depender de servicios cloud externos (Supabase GoTrue, PostgREST Cloud, IndexedDB del navegador, lowdb) para la operativa local de escritorio:

- **Bypass de Autenticación:** Las aplicaciones reconocen la inyección de `window.suite.db` y auto-autentican una sesión local de administrador, eliminando bloqueos en pantallas de login.
- **Canales IPC Tipados (`preload.cjs`):**
  - `window.suite.db.crm.*`: `getDeals`, `createDeal`, `getPipelines`, `getEtapas`, `getClientes`, `createCliente`.
  - `window.suite.db.contactos.*`: `getPersonas`, `createPersona`, `getClientes`, `createCliente`.
  - `window.suite.db.sm.*`: `getPropuestas`, `createPropuesta`, `getCanales`, `getMetricas`.
  - `window.suite.wa.*` / `window.suite.db.wa.*`: `getStatus`, `connect`, `logout`, `getCarpetas`, `createCarpeta`, `getMiembros`, `createMiembro`.
- **Enrutamiento Interno en Shell:** `apps/shell/src/App.tsx` y `Header.tsx` permiten alternar instantáneamente entre el Hub Central, CRM, Contactos, Social Media y WhatsApp manteniendo el estado y con retorno con un solo clic.

---

## 4. Asimilación Exitosa de MejoraWS (Fase 3 Completada)

La integración del motor de WhatsApp ha concluido con éxito siguiendo un criterio estricto de cero contaminación de UI:

1. **Aislamiento del Motor Baileys (`wa-engine`):**
   - Extraído a `apps/shell/electron/wa-engine/` (`engine.mjs`, `bridge.mjs`, `pure.mjs`, `index.mjs`).
   - Se ejecuta como servicio de fondo asíncrono no bloqueante en Electron Main (`app.whenReady()`).
   - Servidor HTTP/SSE puente local en `127.0.0.1:4180` protegido por token criptográfico (`bridge-token.txt`).
   - Gestión física local de credenciales multi-archivo en `%APPDATA%\@mejora\shell\wa-auth`.
2. **Eliminación Absoluta de `lowdb`:**
   - Erradicación total del archivo `data.json` y dependencias de `lowdb`.
   - Persistencia relacional directa y transaccional contra `@mejora/nucleo` (Migración 004).
3. **Tablero Nativo en React 18 (`WaDashboard`):**
   - Construido en `apps/shell/src/components/whatsapp/WaDashboard.tsx` bajo la identidad visual dark glassmorphism de la suite.
   - Polling ligero cada 3 segundos contra `window.suite.wa.getStatus()`.
   - Panel de conexión con renderizado reactivo de código QR (`<img>`), estado de vinculación (`ShieldCheck`, número de teléfono) y desvinculación segura (`logout()`).
   - Panel de carpetas SQLite con visualización de miembros (`ws_miembros`) y modal para creación de listas en tiempo real.
4. **Validación Turborepo:** Compilación limpia de los 5 paquetes en verde (`npx turbo run build --force`) sin advertencias ni conflictos de dependencias.

---

## 5. Hito Alcanzado: Fase de Fricción Cero y Cold Start (Completada)

Se resolvió la fricción operativa de terminales y el arranque en frío del motor estratégico, blindando la experiencia del usuario y estabilizando la interfaz gráfica:

1. **Scripts de Arranque Automáticos de 1-Clic (`arrancar.ps1` y `arrancar.bat`):**
   - Limpieza automática de puertos (`5170` para Vite y `4180` para el bridge de WhatsApp) con liquidación forzada de procesos zombies.
   - Orquestación de Vite en segundo plano sin terminal invasiva (`-WindowStyle Hidden`).
   - Sondeo sincronizado TCP en Loopback (`127.0.0.1:5170`) y apertura automática y sincronizada de Electron.
   - Cierre limpio en bloque `finally` que elimina subprocesos de Vite y libera los puertos al cerrar la ventana.
2. **Cold Start & Semillas de Oro (ADN Ganador B2B):**
   - Creación del script SQL maestro idempotente (`semillas_oro.sql`) y script de inyección (`inyectar_semillas.bat` / `inyectar_semillas.py`).
   - Inyección verificada de los 3 posts históricos con mayor conversión B2B (tasas del 6.46% al 7.54%) en SQLite local para alimentar el contexto de Gemini 1.5 Pro en MejoraSM.
   - Interfaz gráfica interactiva `SemillasOroModal.tsx` conectada al `Header.tsx` y Hub para inspección, edición visual y recálculo de conversión en tiempo real.
3. **Estabilización de Frontend (Resolución de Pantalla Blanca):**
   - Corrección de desestructuración de `onOpenSemillas` en la firma de `Header.tsx` (eliminando `ReferenceError`).
   - Fallbacks seguros a variables de entorno Supabase en `apps/crm/src/integrations/supabase/client.ts` (previniendo `Uncaught Error: supabaseUrl is required`).
   - Inclusión de `export default SemillasOroModal` para compatibilidad de importaciones.
   - Compilación en verde del bundle de producción de Vite (`npm run build --workspace=@mejora/shell`).

---

## 6. Próximo Paso (Fase 4)

- **Distribución y Empaquetado:** Configurar `electron-builder` en `@mejora/shell` para generar el instalador final NSIS y versión portable para Windows 11.

