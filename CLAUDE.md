# CLAUDE.md

Guía para Claude Code al trabajar en este repo.

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
