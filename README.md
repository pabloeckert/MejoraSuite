# MejoraSuite – sede de lanzamiento para Mejora Continua®

MejoraSuite es la sede independiente de la suite de tres productos de Mejora Continua®. No fusiona código de ninguno — cada producto sigue siendo su propio repo, su propio deploy y su propio negocio. MejoraSuite solo los lanza desde una pantalla única.

## 🔗 Los tres productos

| Producto | Qué es | Cómo lo abre MejoraSuite |
|---|---|---|
| **[MejoraCRM](https://github.com/MejoraContinua/MejoraCRM)** | CRM interno — clientes, interacciones, pipeline comercial | navegador del sistema (`crm.mejoraok.com`) |
| **[MejoraContactos](https://github.com/pabloeckert/MejoraContactos)** | SaaS público de limpieza/dedup de contactos con IA | navegador del sistema (GitHub Pages) |
| **[MejoraWS](https://github.com/pabloeckert/MejoraWS)** | App de escritorio para campañas de WhatsApp | protocolo `mejoraws://` (abre la app instalada) |

MejoraCRM es el rector de la fusión y documenta la arquitectura completa en [`mejorasuite/`](https://github.com/MejoraContinua/MejoraCRM/tree/main/mejorasuite) de ese repo (`ESPECIFICACION.md`, `PENDIENTES.md`, `DECISIONES.md`).

## 🚀 Stack

- **Electron** (sin bundler — HTML/CSS/JS planos en `public/`, no hace falta más para una pantalla de 3 botones)
- **electron-builder** para el instalador de Windows (NSIS)

## 📜 Scripts

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Levanta la app en modo desarrollo |
| `npm run dist` | Genera el instalador con electron-builder |

## 🛠️ Cómo funciona

- Los tiles de **MejoraCRM** y **MejoraContactos** llaman a `shell.openExternal()` con la URL de producción de cada uno.
- El tile de **MejoraWS** llama a `shell.openExternal('mejoraws://open')`, el protocolo custom que ese repo ya registra (`electron/main.mjs` de MejoraWS, `app.setAsDefaultProtocolClient`). Si MejoraWS no está instalado, el sistema operativo simplemente no encuentra el handler — no es un error de MejoraSuite.
- El indicador de estado de MejoraWS hace un ping liviano y sin token a `http://127.0.0.1:4180/status` (el bridge local que expone MejoraWS) cada 15s. No necesita el token de auth del bridge — solo le importa si el puerto responde algo.

## 📂 Estructura

```text
├── electron/
│   ├── main.mjs      # ventana, IPC handlers (abrir producto, ping a MejoraWS)
│   └── preload.cjs   # expone window.suite al renderer
└── public/
    ├── index.html
    ├── styles.css     # paleta y tipografías Mejora Continua®
    ├── renderer.js
    ├── brand/         # isotipo y lockup oficiales
    └── fonts/         # Bw Modelica + League Spartan (copias locales)
```

---
© 2026 Mejora Continua®. Todos los derechos reservados.
