# MejoraCRM – CRM inteligente para Mejora Continua®

> **📚 Documentación Completa**: Para información detallada sobre arquitectura, configuración, base de datos y contribución, consulta [DOCS.md](./DOCS.md).

MejoraCRM es una plataforma de gestión de relaciones con clientes (CRM) diseñada para **Mejora Continua®**. Centraliza el flujo comercial, desde el primer contacto hasta el cierre de ventas, proporcionando KPIs en tiempo real y herramientas de seguimiento eficientes.

## 🔗 MejoraSuite

MejoraCRM es el **rector** de una suite de tres productos independientes que se embeben entre sí (repos, deploys y negocios propios — nada se fusiona en un monorepo):

```
MejoraCRM  ──embebe──▶  MejoraContactos   (iframe, /contactos)
    │                        ▲
    └──embebe──▶  MejoraWS   │
                     │        │
                     └───embebe (WebContentsView) / se embebe (bridge local)───┘
```

| Producto | Qué es | Repo |
|---|---|---|
| **MejoraCRM** (acá) | CRM interno, rector de la suite | privado |
| **[MejoraContactos](https://github.com/pabloeckert/MejoraContactos)** | SaaS público de limpieza/dedup de contactos, embebido en `/contactos` | [pabloeckert/MejoraContactos](https://github.com/pabloeckert/MejoraContactos) |
| **[MejoraWS](https://github.com/pabloeckert/MejoraWS)** | App de escritorio para campañas de WhatsApp, estado embebido en `/whatsapp-campanas` vía un bridge local | [pabloeckert/MejoraWS](https://github.com/pabloeckert/MejoraWS) |
| **[MejoraSuite](https://github.com/pabloeckert/MejoraSuite)** | Sede de escritorio (Electron) que lanza los tres productos sin fusionar su código — no embebe ni es embebida, es un cuarto repo aparte | [pabloeckert/MejoraSuite](https://github.com/pabloeckert/MejoraSuite) |

Arquitectura completa, decisiones y estado vivo de la fusión: [`mejorasuite/`](./mejorasuite/) (`ESPECIFICACION.md`, `PENDIENTES.md`, `DECISIONES.md`).

## 🚀 Stack Tecnológico

- **Frontend:** React 18 (SWC) + TypeScript + Vite
- **Estilos:** Tailwind CSS + shadcn/ui
- **Estado & Datos:** TanStack Query v5 (React Query)
- **Backend-as-a-Service:** Supabase (Auth, Database, Edge Functions)
- **Gráficos:** Recharts
- **Gestión de Paquetes:** Bun
- **Tests:** Vitest (Unitarios) + Playwright (E2E)

## ✨ Funcionalidades Principales

- **Dashboard Inteligente:** Visualización de KPIs clave (ventas logradas, tasa de conversión, funnel de ventas) con gráficos interactivos.
- **Gestión de Clientes:** CRUD completo, segmentación por rubro/provincia e importación/exportación masiva (CSV/Excel).
- **Catálogo de Productos:** Gestión de servicios y productos con soporte para múltiples monedas.
- **Flujo de Interacciones:** Wizard de 4 pasos para registrar presupuestos, ventas y seguimientos.
- **Modo Demo:** Explora todas las funcionalidades sin necesidad de una base de datos real.
- **PWA:** Instalable en dispositivos móviles y escritorio para acceso rápido.

## 🛠️ Modo Demo

El proyecto incluye un modo de demostración que permite probar la aplicación sin conexión a Supabase. Se activa mediante la variable de entorno:

```env
VITE_DEMO_MODE=true
```

En este modo, la aplicación utiliza datos estáticos definidos en `src/demo/demoData.ts` y simula las operaciones de escritura en memoria.

## 📜 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `bun run dev` | Inicia el servidor de desarrollo en `localhost:8080` |
| `bun run build` | Construye la aplicación para producción |
| `bun run lint` | Ejecuta el linter (ESLint) |
| `bun run test` | Ejecuta los tests unitarios con Vitest |
| `bun run test:e2e` | Ejecuta los tests de integración con Playwright |

## 📂 Estructura del Proyecto

```text
├── src/
│   ├── components/  # Componentes UI (shadcn) y de dominio (clients, interactions)
│   ├── hooks/       # Custom hooks para fetching de datos y lógica de estado
│   ├── lib/         # Lógica de negocio, cálculos, constantes y esquemas (Zod)
│   ├── pages/       # Vistas principales de la aplicación
│   ├── contexts/    # Proveedores de contexto (Auth, Theme)
│   ├── demo/        # Datos mock para el modo demo
│   └── integrations/ # Configuración y tipos generados de Supabase
├── supabase/        # Migraciones SQL y scripts de seed
└── e2e/             # Tests de integración y End-to-End
```

## 🔄 CI/CD y Deploy

- **CI:** GitHub Actions configurado para ejecutar `lint`, `typecheck`, `test` y `build` en cada Pull Request a `main`.
- **Deploy:** Integración continua con **Vercel**.
- **Seguridad:** Configuración robusta de headers (CSP, HSTS, XSS Protection) definida en `vercel.json`.

**URL de Producción:** [https://crm.mejoraok.com](https://crm.mejoraok.com)

## 🤝 Cómo Contribuir

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/MejoraContinua/MejoraCRM.git
   ```
2. **Instalar dependencias:**
   ```bash
   bun install
   ```
3. **Configurar variables de entorno:**
   Copia `.env.example` a `.env` y configura tus credenciales de Supabase o activa el modo demo.
   ```bash
   cp .env.example .env
   ```
4. **Ejecutar en desarrollo:**
   ```bash
   bun run dev
   ```

## 🗺️ Roadmap Resumido

- [x] Implementación core de Clientes e Interacciones.
- [x] Dashboard con KPIs dinámicos y filtros de período.
- [x] Soporte PWA y Offline base.
- [ ] Integración nativa con Google Calendar para seguimientos.
- [ ] Ampliación de cobertura de tests E2E.
- [ ] Migración completa a tipado estricto en toda la base de datos.

---
© 2026 Mejora Continua®. Todos los derechos reservados.
