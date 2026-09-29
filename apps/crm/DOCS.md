# 📘 Documentación Técnica de MejoraCRM

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Configuración del Entorno](#configuración-del-entorno)
6. [Base de Datos](#base-de-datos)
7. [Autenticación y Autorización](#autenticación-y-autorización)
8. [Módulos Principales](#módulos-principales)
9. [Hooks Personalizados](#hooks-personalizados)
10. [Validación de Datos](#validación-de-datos)
11. [Testing](#testing)
12. [CI/CD y Deploy](#ci-cd-y-deploy)
13. [PWA y Funcionalidades Offline](#pwa-y-funcionalidades-offline)
14. [Guía de Contribución](#guía-de-contribución)

---

## Visión General

**MejoraCRM** es una plataforma de gestión de relaciones con clientes (CRM) diseñada específicamente para **Mejora Continua®**. La aplicación centraliza todo el flujo comercial, desde el primer contacto hasta el cierre de ventas, proporcionando KPIs en tiempo real y herramientas de seguimiento eficientes.

### Características Clave

- **Dashboard Inteligente**: Visualización de KPIs clave con gráficos interactivos
- **Gestión de Clientes**: CRUD completo con segmentación por rubro/provincia
- **Catálogo de Productos**: Gestión de servicios y productos multi-moneda
- **Flujo de Interacciones**: Wizard de 4 pasos para registrar presupuestos, ventas y seguimientos
- **Modo Demo**: Exploración completa sin necesidad de base de datos real
- **PWA**: Instalable en dispositivos móviles y escritorio

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vite + React)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Componentes │  │   Hooks     │  │  Context Providers  │  │
│  │   (shadcn)   │  │ (React Query)│  │  (Auth, Theme)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│           │              │                    │               │
│           └──────────────┴────────────────────┘               │
│                              │                                │
└──────────────────────────────┼────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (BaaS)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │   Storage (S3)      │  │
│  │  Database   │  │   (OAuth)   │  │   (Attachments)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Row Level Security (RLS)                 │   │
│  │         Policies por rol: admin/supervisor/vendedor   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Lectura**: Los componentes React usan hooks personalizados (`useClients`, `useInteractions`, etc.) que internamente utilizan TanStack Query para fetchear datos de Supabase
2. **Escritura**: Las mutaciones se realizan directamente a través del cliente de Supabase con validación previa mediante Zod schemas
3. **Cache**: TanStack Query maneja automáticamente el cacheo, re-fetch y invalidación de datos
4. **Estado Global**: El contexto de autenticación (`AuthContext`) provee información del usuario y rol a toda la aplicación

---

## Stack Tecnológico

### Core

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.8.3 | Tipado estático |
| Vite | 6.4.2 | Build tool y dev server |
| Bun | latest | Package manager y runtime |

### UI y Estilos

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Tailwind CSS | 3.4.17 | Utility-first CSS |
| shadcn/ui | - | Componentes accesibles |
| Radix UI | varias | Primitivos UI sin estilos |
| Lucide React | 0.462.0 | Iconos |
| Recharts | 3.8.1 | Gráficos y visualizaciones |

### Estado y Datos

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| TanStack Query | 5.83.0 | Server state management |
| React Hook Form | 7.73.1 | Gestión de formularios |
| Zod | 4.3.6 | Validación de esquemas |
| @hookform/resolvers | 5.2.2 | Integración Zod + RHF |

### Backend y Servicios

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Supabase JS | 2.103.0 | Cliente BaaS |
| Supabase Auth | incluido | Autenticación y usuarios |
| Supabase DB | PostgreSQL | Base de datos relacional |

### Testing

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Vitest | 4.1.6 | Tests unitarios |
| Playwright | 1.60.0 | Tests E2E |
| Testing Library | 16.3.2 | Testing de componentes |

### Utilidades

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| date-fns | 4.1.0 | Manipulación de fechas |
| clsx + tailwind-merge | 2.1.1 / 1.0.7 | Clases condicionales |
| XLSX | 0.18.5 | Exportación Excel |
| Sonner | 1.7.4 | Notificaciones toast |
| React Router | 6.30.1 | Enrutamiento |
| next-themes | 0.3.0 | Modo oscuro/claro |

---

## Estructura del Proyecto

```
mejoracrm/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI: lint, typecheck, test, build
├── .env.example                   # Plantilla de variables de entorno
├── Branding/                      # Assets de marca (logos, fuentes, favicon)
├── e2e/
│   ├── pom/                       # Page Object Models para Playwright
│   ├── crm-flow.spec.ts           # Tests E2E del flujo principal
│   └── crm-additional-flows.spec.ts
├── public/
│   ├── fonts/                     # Fuentes web
│   ├── icons/                     # Íconos PWA
│   ├── manifest.json              # Manifiesto PWA
│   └── sw.js                      # Service Worker
├── src/
│   ├── assets/
│   │   └── branding/              # Imágenes de marca importables
│   ├── components/
│   │   ├── clients/               # Componentes de gestión de clientes
│   │   ├── dashboard/             # Widgets y vistas del dashboard
│   │   ├── interactions/          # Wizard y cards de interacciones
│   │   │   └── steps/             # Pasos individuales del wizard
│   │   ├── products/              # Componentes de catálogo
│   │   ├── skeletons/             # Loading states
│   │   └── ui/                    # Componentes base (shadcn)
│   ├── contexts/
│   │   └── AuthContext.tsx        # Proveedor de autenticación
│   ├── demo/
│   │   └── demoData.ts            # Datos mock para modo demo
│   ├── hooks/
│   │   ├── useClients.ts          # Fetch y mutación de clientes
│   │   ├── useInteractions.ts     # Fetch y mutación de interacciones
│   │   ├── useProducts.ts         # Fetch y mutación de productos
│   │   ├── useDashboard.ts        # Lógica específica del dashboard
│   │   ├── useProfiles.ts         # Gestión de perfiles
│   │   ├── useGoogleCalendar.ts   # Integración con Google Calendar
│   │   ├── usePWAInstall.ts       # Lógica de instalación PWA
│   │   └── useNotifications.ts    # Sistema de notificaciones
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Configuración del cliente Supabase
│   │       └── types.ts           # Tipos generados automáticamente
│   ├── lib/
│   │   ├── businessLogic.ts       # Cálculo de KPIs y métricas
│   │   ├── calculations.ts        # Funciones utilitarias de cálculo
│   │   ├── constants.ts           # Constantes de la aplicación
│   │   ├── csvParser.ts           # Parser para importación CSV
│   │   ├── excelExport.ts         # Exportación a Excel
│   │   ├── notifications.ts       # Configuración de notificaciones
│   │   ├── schemas.ts             # Esquemas de validación Zod
│   │   ├── types.ts               # Tipos TypeScript compartidos
│   │   └── utils.ts               # Utilidades generales (cn, formateos)
│   ├── pages/
│   │   ├── Auth.tsx               # Página de login/signup
│   │   ├── Clients.tsx            # Gestión de clientes
│   │   ├── Dashboard.tsx          # Vista principal con KPIs
│   │   ├── Interactions.tsx       # Listado de interacciones
│   │   ├── Products.tsx           # Catálogo de productos
│   │   ├── Reports.tsx            # Reportes y análisis
│   │   ├── Settings.tsx           # Configuración de cuenta
│   │   ├── Privacy.tsx            # Política de privacidad
│   │   ├── Terms.tsx              # Términos y condiciones
│   │   └── NotFound.tsx           # Página 404
│   ├── test/
│   │   └── setup.ts               # Configuración de Vitest
│   ├── App.tsx                    # Componente raíz y routing
│   ├── main.tsx                   # Punto de entrada
│   └── index.css                  # Estilos globales
├── supabase/
│   ├── migrations/                # Migraciones versionadas
│   ├── combined-migration.sql     # Script completo para deploy manual
│   ├── config.toml                # Configuración de Supabase CLI
│   └── seed.sql                   # Datos iniciales
├── test-results/                  # Resultados de tests E2E
├── playwright-report/             # Reporte HTML de Playwright
├── CLAUDE.md                      # Guía para Claude Code
├── GEMINI.md                      # Guía para Gemini
├── bun.lock                       # Lockfile de Bun
├── components.json                # Configuración de shadcn/ui
├── eslint.config.js               # Configuración de ESLint
├── index.html                     # HTML de entrada
├── package.json                   # Dependencias y scripts
├── playwright.config.ts           # Configuración de Playwright
├── postcss.config.js              # Configuración de PostCSS
├── run-migration.mjs              # Script de migración
├── tailwind.config.ts             # Configuración de Tailwind
├── tsconfig.json                  # Configuración de TypeScript
├── vercel.json                    # Configuración de deploy en Vercel
├── vite.config.ts                 # Configuración de Vite
└── vitest.config.ts               # Configuración de Vitest
```

---

## Configuración del Entorno

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto basado en `.env.example`:

```bash
cp .env.example .env
```

#### Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública anon de Supabase | `eyJhbG...` |
| `VITE_DEMO_MODE` | Activar modo demo (`true` por defecto) | `true` o `false` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID para Google Calendar (opcional) | `xxxx.apps.googleusercontent.com` |
| `VITE_GOOGLE_API_KEY` | API Key para Google Calendar (opcional) | `AIzaSy...` |

### Modo Demo

El modo demo permite explorar la aplicación sin necesidad de configurar Supabase:

```env
VITE_DEMO_MODE=true
```

En este modo:
- Se utilizan datos mock definidos en `src/demo/demoData.ts`
- La autenticación simula dos roles: `admin` (dueño) y `vendedor`
- Las operaciones de escritura se simulan en memoria
- No se requiere conexión a internet

Para desactivarlo y usar Supabase real:

```env
VITE_DEMO_MODE=false
```

### Instalación

```bash
# Instalar Bun si no está presente
curl -fsSL https://bun.sh/install | bash

# Instalar dependencias
bun install

# Iniciar servidor de desarrollo
bun run dev
```

El servidor estará disponible en `http://localhost:8080`

---

## Base de Datos

### Esquema Principal

La base de datos PostgreSQL en Supabase consta de las siguientes tablas principales:

#### Tablas Core

1. **`profiles`**
   - Almacena información extendida de usuarios
   - Campos: `id`, `user_id`, `full_name`, `avatar_url`, `created_at`, `updated_at`

2. **`user_roles`**
   - Asigna roles a usuarios
   - Roles disponibles: `admin`, `supervisor`, `vendedor`
   - Campos: `id`, `user_id`, `role`

3. **`clients`**
   - Registro de clientes
   - Campos: `id`, `name`, `province`, `segment`, `country`, `status`, `assigned_to`, `created_at`, `updated_at`

4. **`products`**
   - Catálogo de productos/servicios
   - Campos: `id`, `name`, `description`, `price`, `currency`, `unit`, `active`, `created_at`, `updated_at`

5. **`interactions`**
   - Registro de todas las interacciones comerciales
   - Campos principales: `id`, `client_id`, `user_id`, `medium`, `result`, `total_amount`, `currency`, `interaction_date`, `follow_up_date`, `notes`, `loss_reason`, `estimated_loss`
   - Campos específicos según resultado: `quote_path`, `reference_quote_id`, `followup_scenario`, `followup_motive`, `negotiation_state`, `historic_quote_amount`, `historic_quote_date`

6. **`interaction_lines`**
   - Líneas de productos dentro de una interacción
   - Campos: `id`, `interaction_id`, `product_id`, `quantity`, `unit_price`, `line_total`

7. **`audit_logs`**
   - Registro de auditoría de cambios importantes
   - Campos: `id`, `user_id`, `action`, `table_name`, `record_id`, `old_value`, `new_value`, `created_at`

### Enums

```sql
-- Roles de usuario
app_role: 'admin' | 'supervisor' | 'vendedor'

-- Resultados de interacción
interaction_result: 'presupuesto' | 'venta' | 'seguimiento' | 'sin_respuesta' | 'no_interesado'

-- Medios de interacción
interaction_medium: 'whatsapp' | 'llamada' | 'email' | 'reunion_presencial' | 
                    'reunion_virtual' | 'md_instagram' | 'md_facebook' | 
                    'md_linkedin' | 'visita_campo'

-- Estados de cliente
client_status: 'activo' | 'potencial' | 'inactivo'

-- Monedas
currency_code: 'ARS' | 'USD' | 'EUR'

-- Tipo de cotización
quote_path: 'catalogo' | 'adjunto'

-- Escenarios de seguimiento
followup_scenario: 'vinculado' | 'independiente' | 'historico'

-- Estados de negociación
negotiation_state: 'con_interes' | 'sin_respuesta' | 'revisando' | 'pidio_cambios'
```

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas específicas por rol:

- **Admin (`admin`)**: Acceso total a todos los registros
- **Supervisor (`supervisor`)**: Lectura de todos los registros, escritura limitada
- **Vendedor (`vendedor`)**: Solo puede ver/editar sus propios clientes e interacciones

### Funciones RPC

1. **`get_user_role(_user_id UUID)`**: Retorna el rol de un usuario
2. **`has_role(_user_id UUID, _role app_role)`**: Verifica si un usuario tiene un rol específico
3. **`calculate_dashboard_kpis(...)`**: Calcula KPIs del dashboard directamente en la BD
4. **`get_seller_ranking(...)`**: Obtiene ranking de vendedores

### Migraciones

Las migraciones están versionadas en `supabase/migrations/`. Para aplicarlas:

```bash
# Usando Supabase CLI
supabase db push

# O ejecutar manualmente en SQL Editor
# Copiar el contenido de supabase/combined-migration.sql
```

---

## Autenticación y Autorización

### AuthContext

El proveedor de autenticación (`src/contexts/AuthContext.tsx`) maneja:

- Estado de sesión de Supabase Auth
- Rol del usuario (admin/supervisor/vendedor)
- Perfil del usuario (nombre, avatar)
- Modo demo con toggle entre roles

### Uso del Contexto

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, role, profile, loading, signOut, isDemo, toggleDemoRole } = useAuth();
  
  if (loading) return <Loading />;
  
  return (
    <div>
      <h1>Hola, {profile?.full_name}</h1>
      <p>Tu rol es: {role}</p>
      {isDemo && (
        <button onClick={toggleDemoRole}>Cambiar rol demo</button>
      )}
    </div>
  );
}
```

### Roles y Permisos

| Rol | Clientes | Interacciones | Productos | Dashboard | Usuarios |
|-----|----------|---------------|-----------|-----------|----------|
| `admin` | CRUD total | CRUD total | CRUD total | Vista completa | CRUD total |
| `supervisor` | Lectura total | CRUD asignados | Lectura | Vista equipo | Lectura |
| `vendedor` | CRUD propios | CRUD propios | Lectura | Vista personal | - |

---

## Módulos Principales

### Dashboard

**Ubicación**: `src/pages/Dashboard.tsx` + `src/components/dashboard/`

El dashboard presenta KPIs en tiempo real organizados en vistas según el rol:

- **OwnerViewV2**: Vista ejecutiva con métricas globales del negocio
- **SellerViewV2**: Vista individual con métricas personales

#### KPIs Principales

- **Ventas Logradas**: Suma total de ventas cerradas en el período
- **Ventas en Curso**: Valor total de presupuestos activos
- **Ventas No Concretadas**: Pérdidas estimadas
- **Tasa de Conversión**: `(ventas / presupuestos) * 100`
- **Win Rate**: `ventas / (ventas + pérdidas)`
- **Valor Promedio de Venta**: `total ventas / cantidad ventas`

#### Filtros de Período

- Hoy
- Última semana
- Este mes
- Último trimestre
- Último semestre
- Este año

### Gestión de Clientes

**Ubicación**: `src/pages/Clients.tsx` + `src/components/clients/`

Funcionalidades:
- Listado con búsqueda y filtros (por provincia, segmento, estado)
- Alta, edición y baja de clientes
- Importación masiva desde CSV/Excel
- Exportación a CSV/Excel
- Asignación de clientes a vendedores (solo admin)

### Interacciones

**Ubicación**: `src/pages/Interactions.tsx` + `src/components/interactions/`

El wizard de interacciones guía al usuario a través de 4 pasos:

1. **Selección de Cliente**: Buscar y seleccionar cliente existente o crear uno nuevo
2. **Medio de Contacto**: Seleccionar cómo fue el contacto (WhatsApp, llamada, email, etc.)
3. **Resultado**: Definir el resultado (venta, presupuesto, seguimiento, no interesado)
4. **Detalles Específicos**: Campos dinámicos según el resultado seleccionado

#### Flujo por Resultado

- **Venta**: Requiere líneas de productos, monto total, moneda
- **Presupuesto**: Similar a venta pero marcado como pendiente
- **Seguimiento**: Define escenario (vinculado/independiente/histórico), motivo, estado de negociación
- **No Interesado**: Requiere motivo de pérdida y pérdida estimada

### Catálogo de Productos

**Ubicación**: `src/pages/Products.tsx` + `src/components/products/`

- CRUD de productos/servicios
- Soporte multi-moneda (ARS, USD, EUR)
- Activación/desactivación de productos
- Unidad de medida personalizada

### Reportes

**Ubicación**: `src/pages/Reports.tsx`

- Análisis histórico de ventas
- Ranking de vendedores
- Funnel de conversión
- Exportación de datos

---

## Hooks Personalizados

Todos los hooks están en `src/hooks/` y siguen el patrón de TanStack Query.

### useClients

```typescript
const { data: clients, isLoading, error } = useClients();
const { mutate: createClient } = useCreateClient();
const { mutate: updateClient } = useUpdateClient();
const { mutate: deleteClient } = useDeleteClient();
```

### useInteractions

```typescript
const { data: interactions, isLoading } = useInteractions(filters);
const { mutate: createInteraction } = useCreateInteraction();
const { mutate: updateInteraction } = useUpdateInteraction();
```

### useProducts

```typescript
const { data: products, isLoading } = useProducts({ active: true });
const { mutate: createProduct } = useCreateProduct();
```

### useDashboard

Hook especializado que calcula métricas agregadas:

```typescript
const { stats, trends, rankings } = useDashboard(period);
```

### useGoogleCalendar

Integración opcional con Google Calendar para agendar seguimientos:

```typescript
const { connectCalendar, createEvent, events } = useGoogleCalendar();
```

---

## Validación de Datos

### Esquemas Zod

Los esquemas están definidos en `src/lib/schemas.ts`:

#### Interaction Schema

```typescript
export const interactionSchema = z.object({
  client_id: z.string().min(1, "Seleccioná un cliente"),
  medium: z.enum(mediums),
  result: z.enum(results),
  
  // Presupuesto
  quote_path: z.enum(["catalogo", "adjunto"]).optional(),
  currency: z.string().optional().default("ARS"),
  total_amount: z.number().nullable().optional(),
  attachment_url: z.string().url().nullable().optional(),
  
  // Venta
  reference_quote_id: z.string().uuid().nullable().optional(),
  
  // Seguimiento
  followup_scenario: z.enum(["vinculado", "independiente", "historico"])
    .nullable().optional(),
  followup_motive: z.string().nullable().optional(),
  negotiation_state: z.enum(["con_interes", "sin_respuesta", "revisando", "pidio_cambios"])
    .nullable().optional(),
  
  // No interesado
  loss_reason: z.string().nullable().optional(),
  estimated_loss: z.number().nullable().optional(),
  
  // Common
  next_step: z.string().nullable().optional(),
  follow_up_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})
// Validaciones cruzadas
.refine(
  (data) => {
    if (data.result === "no_interesado") return !!data.loss_reason;
    return true;
  },
  { message: "Indicá el motivo de pérdida", path: ["loss_reason"] }
);
```

### Integración con React Hook Form

```typescript
const form = useForm<InteractionFormData>({
  resolver: zodResolver(interactionSchema),
  defaultValues: {
    currency: "ARS",
    // ...
  },
});
```

---

## Testing

### Tests Unitarios (Vitest)

Los tests unitarios están ubicados junto a los archivos que testean:

```bash
# Ejecutar todos los tests
bun run test

# Modo watch
bun run test:watch
```

#### Archivos Testeados

- `src/lib/businessLogic.test.ts`: Cálculo de KPIs
- `src/lib/calculations.test.ts`: Funciones de cálculo
- `src/lib/constants.test.ts`: Validación de constantes
- `src/lib/csvParser.test.ts`: Parser de CSV
- `src/lib/schemas.test.ts`: Validación de schemas
- `src/hooks/useClients.test.ts`: Hooks de clientes
- `src/hooks/useInteractions.test.ts`: Hooks de interacciones
- `src/components/clients/ClientForm.test.tsx`: Formularios
- `src/components/dashboard/KPICard.test.tsx`: Componentes de dashboard

### Tests E2E (Playwright)

```bash
# Ejecutar tests E2E
bun run test:e2e

# Modo UI
bun run test:e2e:ui
```

#### Flujos Testeados

- `e2e/crm-flow.spec.ts`: Flujo completo de CRM (login → cliente → interacción → venta)
- `e2e/crm-additional-flows.spec.ts`: Flujos adicionales (filtros, exportación, etc.)

### Page Object Models

Los POMs están en `e2e/pom/`:

- `LoginPage.ts`: Login
- `ClientsPage.ts`: Gestión de clientes
- `InteractionsPage.ts`: Interacciones
- `DashboardPage.ts`: Dashboard

---

## CI/CD y Deploy

### GitHub Actions

El workflow de CI (`.github/workflows/ci.yml`) se ejecuta en cada push a `main` y en cada PR:

```yaml
jobs:
  lint-build-test:
    steps:
      - Checkout
      - Setup Bun
      - Install dependencies
      - Lint (ESLint)
      - Type check (TypeScript)
      - Test (Vitest)
      - Build (Vite)
```

### Vercel

El deploy a producción es automático en Vercel al hacer push a `main`.

#### Configuración (vercel.json)

- **Build Command**: `bun run build`
- **Output Directory**: `dist`
- **Install Command**: `bun install --frozen-lockfile`
- **Rewrites**: SPA routing (`/* → /index.html`)
- **Headers**: Seguridad reforzada (CSP, HSTS, XSS Protection)

#### Headers de Seguridad

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ..."
}
```

### URL de Producción

[https://crm.mejoraok.com](https://crm.mejoraok.com)

---

## PWA y Funcionalidades Offline

### Manifiesto PWA

El archivo `public/manifest.json` define:

- Nombre y descripción de la app
- Íconos para diferentes tamaños
- Modo de display (`standalone`)
- Color de tema y background

### Service Worker

El service worker (`public/sw.js`) implementa:

- Cache de assets estáticos
- Estrategia cache-first para recursos
- Network-first para API calls (cuando hay conexión)
- Offline fallback page

### Instalación

El hook `usePWAInstall` provee la lógica para mostrar el botón de instalación nativa.

---

## Guía de Contribución

### Flujo de Trabajo

1. **Forkear el repositorio** (si es externo)
2. **Clonar localmente**:
   ```bash
   git clone https://github.com/MejoraContinua/MejoraCRM.git
   cd MejoraCRM
   ```
3. **Crear rama feature**:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
4. **Desarrollar y testear**:
   ```bash
   bun run dev
   bun run test
   bun run test:e2e
   ```
5. **Commit siguiendo Convencional Commits**:
   ```bash
   git commit -m "feat: agregar filtro por provincia en clientes"
   ```
6. **Push y Pull Request**

### Convencional Commits

```
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
style: Cambios de formato (sin impacto en código)
refactor: Refactorización (sin cambio de comportamiento)
test: Agregar/modificar tests
chore: Tareas de mantenimiento
```

### Estándares de Código

- **TypeScript**: Tipado estricto habilitado
- **ESLint**: Reglas configuradas en `eslint.config.js`
- **Prettier**: Formato automático (integrado con ESLint)
- **Componentes**: Seguir patrones de shadcn/ui
- **Tests**: Cobertura mínima del 80% para nuevas features

### Review Process

1. Todos los PRs requieren al menos 1 aprobación
2. CI debe pasar (lint, typecheck, tests, build)
3. Tests E2E deben pasar para cambios significativos
4. Merge a `main` hace deploy automático a producción

---

## Recursos Adicionales

### Enlaces Útiles

- [Documentación de React](https://react.dev)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Zod Documentation](https://zod.dev)

### Contacto

Para consultas técnicas o soporte, contactar al equipo de desarrollo de Mejora Continua®.

---

© 2026 Mejora Continua®. Todos los derechos reservados.
