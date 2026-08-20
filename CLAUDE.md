# CLAUDE.md

Guía para Claude Code al trabajar en este repo.

## Criterio de modelo y esfuerzo — Mejora Continua

Antes de cada tarea, decidí en silencio y nombrá en una línea al arranque: `Modelo: X · Esfuerzo: Y — razón corta`.

**Modelo:**
- **Sonnet (default).** Todo lo cotidiano: features, fixes, debugging, scripts, refactors chicos. Es el piso — no bajar salvo tarea trivial de alto volumen (ahí Haiku si está disponible en el flujo).
- **Opus.** Solo si aparece una de estas señales: el cambio toca dependencias cruzadas donde un error se propaga en cascada; ya se intentó con Sonnet y falló o quedó a medias; hay más de 2 restricciones en conflicto real (performance vs legibilidad vs deadline, etc); es una decisión de arquitectura cara de revertir. Nunca Opus "por las dudas" o porque la tarea suena importante.

**Esfuerzo / extended thinking:** normal por default. Alto solo con ambigüedad real, múltiples restricciones en conflicto, o un bug que ya resistió un intento con esfuerzo normal.

**Higiene de sesión:** un propósito por sesión, no mezclar tareas grandes no relacionadas en el mismo hilo largo. No repetir contexto que ya está en el repo — leerlo, no explicarlo de nuevo en el prompt. Automatización real (loops, cron, CI, correr sin la app abierta) → confirmar que efectivamente necesita correr desacoplado antes de armar el script.

*(Versión condensada para Code. El criterio completo vive en la skill `optimo-de-uso`. Si cambia, actualizar también ahí y en `C:\Github\CLAUDE.md`.)*

## Qué es este repo

MejoraSuite es la **sede independiente** de la fusión MejoraCRM + MejoraContactos + MejoraWS. No contiene código de ninguno de los tres — es una app Electron mínima (una pantalla, 3 tiles) que solo los lanza:

- MejoraCRM y MejoraContactos → `shell.openExternal()` a sus URLs de producción.
- MejoraWS → `shell.openExternal('mejoraws://open')`, el protocolo custom que ese repo registra.

Ver `README.md` para el detalle de cada tile y el ping de estado.

**Fuente de verdad de la arquitectura de la fusión completa** (por qué existe este repo, cómo se relacionan los otros tres): `mejorasuite/ESPECIFICACION.md`, `PENDIENTES.md` y `DECISIONES.md` en el repo de [MejoraCRM](https://github.com/MejoraContinua/MejoraCRM) — MejoraCRM es el rector de la fusión y esos documentos son los que se actualizan en cada sesión.

## Comandos

```bash
npm install     # instalar dependencias
npm run dev     # levanta la app (electron .)
npm run dist    # genera instalador Windows (NSIS) con electron-builder
```

No hay build step de bundler (Vite/webpack) — `public/` se sirve tal cual, sin transformar.

## Convenciones

- **No agregar dependencias de UI/framework** (React, Vue, etc.) a menos que la pantalla de lanzamiento crezca mucho más allá de 3 tiles — hoy HTML/CSS/JS planos alcanza y sobra.
- **No reimplementar lógica de ningún producto acá.** Si hace falta más integración con MejoraWS que un ping de estado, esa lógica va en el bridge de MejoraWS (`electron/bridge.mjs` de ese repo), no en MejoraSuite.
- **Paleta y tipografías** son las de Mejora Continua® (`public/styles.css`, tokens `--azul #1A3D84`, `--amarillo #F7CC13`, `--rojo #E1061E` — mismos valores que `BRAND` en `MejoraCRM/src/lib/constants.ts`). No introducir otra paleta.
- **Assets de marca** (`public/brand/`, `public/fonts/`) son copias locales vetadas desde el skill `mejora-continua-brand` / los otros repos — no regenerar ni recolorear.

## Pendiente

- [x] Ícono de la app / instalador (`public/brand/icon.ico`, cableado en `electron/main.mjs` como ícono de ventana en Windows y en `package.json` → `build.win.icon` para el instalador NSIS).
- [ ] Firma de código del instalador — no configurada, el NSIS actual no está firmado. Hoy no bloquea: el sistema es de **uso interno**. Retomar si algún día se distribuye fuera de Mejora Continua (requiere certificado Authenticode).
