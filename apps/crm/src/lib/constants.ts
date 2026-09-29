/**
 * Shared constants across the CRM.
 * Single source of truth for labels, styles, and display mappings.
 */

/* ── Interaction Results ─────────────────────────────────────── */

export type Result = "presupuesto" | "venta" | "seguimiento" | "sin_respuesta" | "no_interesado";

export const RESULT_LABELS: Record<Result, string> = {
  presupuesto: "Envié un presupuesto",
  venta: "Cerré una venta",
  seguimiento: "Hice un seguimiento",
  sin_respuesta: "Sin respuesta",
  no_interesado: "No le interesó",
};

export const RESULT_STYLES: Record<string, string> = {
  presupuesto: "bg-primary/10 text-primary border-primary/20",
  venta: "bg-success/10 text-success border-success/20",
  seguimiento: "bg-accent/20 text-accent-foreground border-accent/30",
  sin_respuesta: "bg-muted text-muted-foreground border-border",
  no_interesado: "bg-destructive/10 text-destructive border-destructive/20",
};

/* ── Contact Medium ──────────────────────────────────────────── */

export const MEDIUM_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  llamada: "Llamada",
  email: "Email",
  reunion_presencial: "R. presencial",
  reunion_virtual: "R. virtual",
  md_instagram: "Instagram",
  md_facebook: "Facebook",
  md_linkedin: "LinkedIn",
  visita_campo: "Visita campo",
};

/* ── Client Status ───────────────────────────────────────────── */

export const STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  potencial: "Potencial",
  inactivo: "Inactivo",
};

export const STATUS_STYLES: Record<string, string> = {
  activo: "bg-success/10 text-success border-success/20",
  potencial: "bg-primary/10 text-primary border-primary/20",
  inactivo: "bg-muted text-muted-foreground border-border",
};

/* ── Client Form Options ─────────────────────────────────────── */

export const CHANNELS = [
  "WhatsApp", "Email", "Redes sociales", "Referido",
  "Teléfono", "Feria/Evento", "Sitio web",
];

export const RUBROS = [
  "Forestal", "Agropecuario", "Industrial", "Construcción",
  "Gobierno", "Particular", "Comercio", "Otro",
];

export const PAISES = [
  "Argentina", "Uruguay", "Chile", "Paraguay", "Brasil",
  "Bolivia", "Perú", "Colombia", "México", "España", "Otro",
];

export const PROVINCIAS = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut",
  "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy",
  "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén",
  "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz",
  "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán",
];

/* ── Product Units ───────────────────────────────────────────── */

export const UNITS: { value: string; label: string }[] = [
  { value: "u", label: "Unidad" },
  { value: "kg", label: "Kilogramo" },
  { value: "tn", label: "Tonelada" },
  { value: "m3", label: "Metro cúbico" },
  { value: "m2", label: "Metro cuadrado" },
  { value: "ml", label: "Metro lineal" },
  { value: "ha", label: "Hectárea" },
  { value: "lt", label: "Litro" },
  { value: "hr", label: "Hora" },
  { value: "servicio", label: "Servicio" },
];

export const CURRENCIES: ("ARS" | "USD" | "EUR")[] = ["ARS", "USD", "EUR"];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  ARS: "$",
  USD: "USD",
  EUR: "€",
};

/* ── Interaction Form Options ────────────────────────────────── */

export const NEGOTIATION_LABELS: Record<string, string> = {
  con_interes: "Con interés",
  sin_respuesta: "Sin respuesta",
  revisando: "Está revisando",
  pidio_cambios: "Pidió cambios",
};

export const FOLLOWUP_SCENARIOS: Record<string, string> = {
  vinculado: "Sobre presupuesto cargado",
  independiente: "Seguimiento independiente",
  historico: "Sobre presupuesto histórico (no cargado)",
};

export const LOSS_REASONS = [
  "Precio",
  "Falta de financiación",
  "Tiempo de entrega",
  "Logística",
  "Compró a la competencia",
  "Necesidad no confirmada",
  "Otro",
];

/* ── Deal Aging Thresholds ───────────────────────────────────── */

export const AGING_THRESHOLDS = {
  AMBER_HOURS: 48,   // 2 días — negocio en riesgo de enfriarse
  RED_HOURS: 120,    // 5 días — acción urgente requerida
} as const;

/* ── Chart Colors ────────────────────────────────────────────── */

export const CHART_COLORS = [
  "#1A3D84",  // azul MC 2026
  "#F7CC13",  // amarillo MC 2026
  "#2E7D32",  // verde
  "#E1061E",  // rojo MC 2026
  "#2E5BA8",  // azul medio MC
  "#6B7280",  // gris
];

/* ── Brand Colors (for PDF/print) ────────────────────────────── */

export const BRAND = {
  primary: "#1A3D84",
  secondary: "#2E5BA8",
  accent: "#F7CC13",
  destructive: "#E1061E",
  success: "#2E7D32",
  muted: "#6B7280",
  background: "#FFFFFF",
  backgroundAlt: "#F2F2F2",
} as const;
