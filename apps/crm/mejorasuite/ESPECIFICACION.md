# MejoraSuite — especificación de la fusión de MejoraCRM + MejoraContactos + MejoraWS

**Este documento es la fuente de verdad de la arquitectura.** `PENDIENTES.md` dice qué falta, `DECISIONES.md` por qué se decidió cada cosa, `PROMPT_CONTINUACION.md` cómo retomar el trabajo en una sesión nueva. Vive en `MejoraCRM/mejorasuite/` porque MejoraCRM es el rector del conjunto — ver veredicto abajo.

## Los tres productos (verificado línea por línea contra el código real, no contra el resumen de Lovable)

| Producto | Repo | Deploy | Qué es hoy |
|---|---|---|---|
| **MejoraCRM** | [github.com/pabloeckert/MejoraCRM](https://github.com/pabloeckert/MejoraCRM) (privado) — local `C:\Github\Negocio\MejoraCRM` | Vercel, auto-deploy en push a `main` → `crm.mejoraok.com` | CRM interno de Mejora Continua®. React 18 + TS + Vite + Supabase multi-tenant. Usuarios reales (Pablo, Sindy, vendedores). |
| **MejoraContactos** | [github.com/pabloeckert/MejoraContactos](https://github.com/pabloeckert/MejoraContactos) (público) — local (clonar) | GitHub Pages, auto-deploy en push a `main` | **Producto SaaS público independiente** con landing/pricing/tiers free-pro (500 contactos/lote, 3 lotes/día gratis). Motor de limpieza/dedup de contactos 100% en el browser (IndexedDB, Web Workers, 12 proveedores de IA). **No confundir con `motor-contactos/`** (ver abajo). |
| **MejoraWS** | [github.com/pabloeckert/MejoraWS](https://github.com/pabloeckert/MejoraWS) (público) — local (clonar) | Ninguno — app de escritorio, se corre local | Herramienta personal de Pablo: Electron + React 19 + Baileys (WhatsApp no oficial) para campañas de WhatsApp por carpetas, con revisión de copy por IA. |
| **MejoraSuite** | [github.com/pabloeckert/MejoraSuite](https://github.com/pabloeckert/MejoraSuite) (privado) — local `C:\Github\Negocio\MejoraSuite` | Ninguno — app de escritorio, se corre local | **Cuarto repo, agregado 2026-08-17.** No es parte de la topología de embebido de los tres de arriba — es una *sede* externa a los tres: Electron mínimo, sin bundler, con 3 tiles que lanzan cada producto (`shell.openExternal` a MejoraCRM/MejoraContactos, protocolo `mejoraws://` para MejoraWS). No contiene código de ninguno de los tres ni los fusiona. Ver detalle en `README.md`/`CLAUDE.md` de ese repo. |

**`motor-contactos/`** (dentro del repo de MejoraContactos, gitignored, con su propio git local sin remoto) **no es parte de esta fusión.** Es un proyecto personal y privado de Pablo — Python, ya cerrado el 2026-08-13, corrido una vez contra los Google Contacts reales de Pablo y Sindy (36.103 registros → 8.541 contactos finales). Lo único que le queda pendiente (sync de vuelta a Google Contacts) es un flujo aparte que no toca esta fusión. Se documenta acá solo para que una sesión nueva no lo confunda con "MejoraContactos" el producto SaaS.

## Veredicto de rector — topología de embebido

Cada uno de los tres sigue siendo **un producto independiente**: su propio repo, su propio deploy, su propio negocio/uso. Ninguno se apaga ni se absorbe. Sobre eso, la topología acordada con Pablo (2026-08-15) es:

```
MejoraCRM        (rector general) → embebe adentro a MejoraContactos Y a MejoraWS
MejoraContactos  (rector de sí mismo) → embebe adentro a MejoraWS
MejoraWS         (rector de sí mismo) → embebe adentro a MejoraContactos
```

Es decir: parado en cualquiera de los tres, se puede llegar a los otros dos sin salir de la app. MejoraCRM es el único que contiene a los otros dos simultáneamente (por eso es "el rector" en el sentido amplio que se acordó al principio: es el que tiene usuarios reales, datos multi-tenant y auth ya resueltos).

## Cómo se embebe cada par (mecanismo técnico — decisión de Claude, no de Lovable)

Lovable proponía portar todo a un solo Electron y reescribir Baileys en TS dentro de ese proceso nuevo. **Se descarta esa vía.** Motivo: una sesión anterior de Claude ya evaluó exactamente esto para la relación motor-contactos↔MejoraWS y lo rechazó por escrito (`motor-contactos/src/motor/mejoraws_launcher.py`, docstring) — reescribir Baileys en otro stack duplica una lógica ya afinada (delay random, tope diario) con más riesgo de ban de cuenta, no menos. Se aplica el mismo criterio a los tres embebidos:

- **MejoraCRM ⟷ MejoraContactos (web ⟷ web)**: embebido por `<iframe>` apuntando a la URL pública desplegada de cada uno (`crm.mejoraok.com` / la URL de GitHub Pages de MejoraContactos). Cero acoplamiento de código, cada uno sigue deployando por su cuenta sin coordinar builds.
- **MejoraWS embebe MejoraContactos (Electron ⟷ web)**: Electron aloja la URL pública de MejoraContactos en un `<webview>`/`BrowserView` — Electron está hecho para esto, no hace falta nada especial.
- **MejoraCRM / MejoraContactos embeben MejoraWS (web ⟷ Electron)**: un navegador no puede embeber un proceso de escritorio de otro. Se usa el mismo patrón que ya existe y funciona (`mejoraws_launcher.py`): un panel liviano que (a) lanza/enfoca la app de escritorio si no está corriendo, y (b) habla con un bridge local HTTP/WebSocket que el proceso principal de MejoraWS expone en `localhost` (a construir — hoy MejoraWS no tiene ese bridge, solo el `.bat` de lanzamiento) para mostrar estado (conectado/desconectado, cola de envíos, métricas) sin mover la lógica de Baileys de lugar.

Esto también resuelve en simultáneo el pedido de "que los mensajes de WhatsApp dejen rastro en el CRM" del brief original de Lovable: el bridge local de MejoraWS es el canal por el que las respuestas/envíos se convierten en Interacciones dentro de MejoraCRM, sin que MejoraCRM necesite saber nada de Baileys.

## Restricciones que no se negocian (verificadas, no asumidas)

- **Nunca** los datos de `motor-contactos/Data/` (contactos reales de terceros) van a ningún repo público — ya está así, no tocar ese `.gitignore`.
- **Nunca** reescribir o mover la lógica de Baileys/envío de WhatsApp fuera de `MejoraWS/electron/`. Delay random y tope diario existentes no son negociables ni configurables por debajo de un mínimo.
- El plan de Lovable de "un solo repo Vite SPA" queda descartado — cada repo sigue siendo su propio proyecto, con su propio `CLAUDE.md`, su propio CI, su propio deploy.
- Versiones de cada stack **no se unifican** (a diferencia de lo que proponía Lovable) — al no fusionar código, React 18 (CRM/Contactos) y React 19 (WS) conviven sin conflicto porque nunca comparten un mismo bundle.

## Estado de la auditoría de seguridad de los 3 repos (2026-08-15)

- MejoraCRM: `.env` real y `run-migration.mjs` con `service_role` key + contraseñas en texto plano estaban commiteados — **corregido** (ver `CLAUDE.md` del repo, commits `1b0877d2`/`e63f6afd`/`cca01b23`). **Pendiente que Pablo rote la key en Supabase Dashboard** y cambie esas contraseñas — Claude no puede hacerlo.
- MejoraContactos: sin secretos ni datos reales en el historial de git (verificado, `.env.example` únicamente, `Data/` correctamente excluido).
- MejoraWS: sin secretos ni datos reales en el historial de git. `TRANSCRIPCION-SESION.md` (159KB, trackeado, público) es un log técnico de desarrollo — sin teléfonos/emails reales, verificado con grep.
