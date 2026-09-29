/**
 * Demo data for MejoraCRM — no real Supabase needed.
 * Mock interactions, clients, profiles for preview/demo mode.
 */

export const DEMO_ORG_ID = "demo-org-001";

export const DEMO_OWNER = {
  id: "demo-owner-001",
  email: "dueno@mejoraok.com",
  full_name: "Pablo Eckert",
  role: "admin" as const,
};

export const DEMO_SELLER = {
  id: "demo-seller-001",
  email: "vendedor@mejoraok.com",
  full_name: "Sindy Geisert",
  role: "vendedor" as const,
};

export const DEMO_CLIENTS = [
  { id: "c1", name: "Forestal del Sur S.A.", province: "Misiones", segment: "Forestal", country: "AR", status: "activo", assigned_to: DEMO_SELLER.id, created_at: "2026-01-15", whatsapp: "+54 376 4123456", email: "contacto@forestaldelsur.com.ar" },
  { id: "c2", name: "Agro Campos Verdes", province: "Córdoba", segment: "Agropecuario", country: "AR", status: "activo", assigned_to: DEMO_SELLER.id, created_at: "2026-02-03", whatsapp: "+54 351 4234567", email: "info@camposverdes.com.ar" },
  { id: "c3", name: "Industrias Metalúrgicas del Plata", province: "Buenos Aires", segment: "Industrial", country: "AR", status: "activo", assigned_to: DEMO_OWNER.id, created_at: "2026-02-10", whatsapp: "+54 11 4345678", email: "compras@metalurgicasdelplata.com.ar" },
  { id: "c4", name: "Constructora Andes", province: "Mendoza", segment: "Construcción", country: "AR", status: "activo", assigned_to: DEMO_SELLER.id, created_at: "2026-03-01", whatsapp: "+54 261 4456789", email: "obras@constructoraandes.com.ar" },
  { id: "c5", name: "Gobierno Provincial de Salta", province: "Salta", segment: "Gobierno", country: "AR", status: "activo", assigned_to: DEMO_OWNER.id, created_at: "2026-03-12", whatsapp: "+54 387 4567890", email: "compras@salta.gob.ar" },
  { id: "c6", name: "Comercializadora Norte", province: "Tucumán", segment: "Comercio", country: "AR", status: "activo", assigned_to: DEMO_SELLER.id, created_at: "2026-03-20", whatsapp: "+54 381 4678901", email: "ventas@comercnorte.com.ar" },
  { id: "c7", name: "Estancia La Esperanza", province: "Santa Fe", segment: "Agropecuario", country: "AR", status: "activo", assigned_to: DEMO_OWNER.id, created_at: "2026-04-01", whatsapp: "+54 342 4789012", email: "administracion@laesperanza.com.ar" },
  { id: "c8", name: "Frío Industrial S.R.L.", province: "Buenos Aires", segment: "Industrial", country: "AR", status: "inactivo", assigned_to: DEMO_SELLER.id, created_at: "2026-04-10", whatsapp: "+54 11 4890123", email: "contacto@frioindustrial.com.ar" },
];

export const DEMO_PROFILES = [
  { user_id: DEMO_OWNER.id, full_name: DEMO_OWNER.full_name, avatar_url: null, role: "admin" as const, monthly_target: 2_000_000 },
  { user_id: DEMO_SELLER.id, full_name: DEMO_SELLER.full_name, avatar_url: null, role: "vendedor" as const, monthly_target: 1_500_000 },
];

// Store mutable — igual al patrón de MEMORY_DEMO_CLIENTS
export let MEMORY_DEMO_PROFILES = [...DEMO_PROFILES];

export function setDemoTarget(user_id: string, monthly_target: number | null) {
  MEMORY_DEMO_PROFILES = MEMORY_DEMO_PROFILES.map((p) =>
    p.user_id === user_id ? { ...p, monthly_target } : p
  );
}

export const DEMO_INTERACTIONS = [
  // Ventas cerradas
  { id: "i1", client_id: "c1", user_id: DEMO_SELLER.id, result: "venta", total_amount: 850000, currency: "ARS", interaction_date: "2026-04-05", follow_up_date: null, notes: "Semillas de pino — entrega abril", estimated_loss: null, clients: { name: "Forestal del Sur S.A.", province: "Misiones", segment: "Forestal" }, interaction_lines: [{ products: { name: "Semillas de pino" }, quantity: 200, unit_price: 4250, line_total: 850000 }] },
  { id: "i2", client_id: "c2", user_id: DEMO_SELLER.id, result: "venta", total_amount: 620000, currency: "ARS", interaction_date: "2026-04-08", follow_up_date: null, notes: "Servicio de fumigación zona sur", estimated_loss: null, clients: { name: "Agro Campos Verdes", province: "Córdoba", segment: "Agropecuario" }, interaction_lines: [{ products: { name: "Servicio fumigación" }, quantity: 1, unit_price: 620000, line_total: 620000 }] },
  { id: "i3", client_id: "c3", user_id: DEMO_OWNER.id, result: "venta", total_amount: 1500000, currency: "ARS", interaction_date: "2026-04-10", follow_up_date: null, notes: "Madera laminada para exportación", estimated_loss: null, clients: { name: "Industrias Metalúrgicas del Plata", province: "Buenos Aires", segment: "Industrial" }, interaction_lines: [{ products: { name: "Madera laminada" }, quantity: 50, unit_price: 30000, line_total: 1500000 }] },
  { id: "i4", client_id: "c7", user_id: DEMO_OWNER.id, result: "venta", total_amount: 7500, currency: "USD", interaction_date: "2026-04-12", follow_up_date: null, notes: "Contrato de mantenimiento anual", estimated_loss: null, clients: { name: "Estancia La Esperanza", province: "Santa Fe", segment: "Agropecuario" }, interaction_lines: [{ products: { name: "Servicio mantenimiento" }, quantity: 1, unit_price: 7500, line_total: 7500 }] },
  { id: "i5", client_id: "c5", user_id: DEMO_OWNER.id, result: "venta", total_amount: 350000, currency: "ARS", interaction_date: "2026-04-15", follow_up_date: null, notes: "Árboles para parque provincial", estimated_loss: null, clients: { name: "Gobierno Provincial de Salta", province: "Salta", segment: "Gobierno" }, interaction_lines: [{ products: { name: "Árboles ornamentales" }, quantity: 100, unit_price: 3500, line_total: 350000 }] },
  { id: "i6", client_id: "c6", user_id: DEMO_SELLER.id, result: "venta", total_amount: 280000, currency: "ARS", interaction_date: "2026-04-18", follow_up_date: null, notes: "Semillas de soja premium", estimated_loss: null, clients: { name: "Comercializadora Norte", province: "Tucumán", segment: "Comercio" }, interaction_lines: [{ products: { name: "Semillas de soja" }, quantity: 100, unit_price: 2800, line_total: 280000 }] },

  // Presupuestos en curso
  { id: "i7", client_id: "c1", user_id: DEMO_SELLER.id, result: "presupuesto", total_amount: 1200000, currency: "ARS", interaction_date: "2026-05-10", follow_up_date: "2026-05-24", notes: "Pedido grande de eucalipto", estimated_loss: null, clients: { name: "Forestal del Sur S.A.", province: "Misiones", segment: "Forestal" }, interaction_lines: [{ products: { name: "Semillas de eucalipto" }, quantity: 500, unit_price: 2400, line_total: 1200000 }] },
  { id: "i8", client_id: "c4", user_id: DEMO_SELLER.id, result: "presupuesto", total_amount: 950000, currency: "ARS", interaction_date: "2026-05-12", follow_up_date: "2026-05-26", notes: "Madera para obra nueva", estimated_loss: null, clients: { name: "Constructora Andes", province: "Mendoza", segment: "Construcción" }, interaction_lines: [{ products: { name: "Madera estructural" }, quantity: 30, unit_price: 31667, line_total: 950000 }] },
  { id: "i9", client_id: "c3", user_id: DEMO_OWNER.id, result: "presupuesto", total_amount: 15000, currency: "USD", interaction_date: "2026-05-14", follow_up_date: "2026-05-28", notes: "Proyecto exportación madera certificada", estimated_loss: null, clients: { name: "Industrias Metalúrgicas del Plata", province: "Buenos Aires", segment: "Industrial" }, interaction_lines: [] },
  { id: "i10", client_id: "c2", user_id: DEMO_SELLER.id, result: "presupuesto", total_amount: 360000, currency: "ARS", interaction_date: "2026-05-15", follow_up_date: "2026-05-22", notes: "Tratamiento fitosanitario lote 5", estimated_loss: null, clients: { name: "Agro Campos Verdes", province: "Córdoba", segment: "Agropecuario" }, interaction_lines: [{ products: { name: "Servicio fitosanitario" }, quantity: 1, unit_price: 360000, line_total: 360000 }] },

  // Seguimientos pendientes (próximos)
  { id: "i11", client_id: "c6", user_id: DEMO_SELLER.id, result: "seguimiento", total_amount: null, currency: "ARS", interaction_date: "2026-05-14", follow_up_date: "2026-05-22", notes: "Llamar para confirmar pedido semillas", estimated_loss: null, clients: { name: "Comercializadora Norte", province: "Tucumán", segment: "Comercio" }, interaction_lines: [] },
  { id: "i12", client_id: "c4", user_id: DEMO_SELLER.id, result: "seguimiento", total_amount: null, currency: "ARS", interaction_date: "2026-05-15", follow_up_date: "2026-05-26", notes: "Enviar muestras de madera", estimated_loss: null, clients: { name: "Constructora Andes", province: "Mendoza", segment: "Construcción" }, interaction_lines: [] },
  { id: "i13", client_id: "c7", user_id: DEMO_OWNER.id, result: "seguimiento", total_amount: null, currency: "ARS", interaction_date: "2026-05-16", follow_up_date: "2026-05-28", notes: "Visita técnica programada", estimated_loss: null, clients: { name: "Estancia La Esperanza", province: "Santa Fe", segment: "Agropecuario" }, interaction_lines: [] },

  // Seguimientos vencidos (para demostrar alertas)
  { id: "i14", client_id: "c1", user_id: DEMO_SELLER.id, result: "seguimiento", total_amount: null, currency: "ARS", interaction_date: "2026-05-01", follow_up_date: "2026-05-08", notes: "Cotización adicional pendiente", estimated_loss: null, clients: { name: "Forestal del Sur S.A.", province: "Misiones", segment: "Forestal" }, interaction_lines: [] },
  { id: "i15", client_id: "c5", user_id: DEMO_OWNER.id, result: "seguimiento", total_amount: null, currency: "ARS", interaction_date: "2026-05-02", follow_up_date: "2026-05-10", notes: "Esperando respuesta licitación", estimated_loss: null, clients: { name: "Gobierno Provincial de Salta", province: "Salta", segment: "Gobierno" }, interaction_lines: [] },
  { id: "i16", client_id: "c8", user_id: DEMO_SELLER.id, result: "seguimiento", total_amount: null, currency: "ARS", interaction_date: "2026-05-05", follow_up_date: "2026-05-13", notes: "Reactivar relación comercial", estimated_loss: null, clients: { name: "Frío Industrial S.R.L.", province: "Buenos Aires", segment: "Industrial" }, interaction_lines: [] },

  // Ventas perdidas
  { id: "i17", client_id: "c8", user_id: DEMO_SELLER.id, result: "no_interesado", total_amount: null, currency: "ARS", interaction_date: "2026-04-20", follow_up_date: null, notes: "Prefirió proveedor local", estimated_loss: 400000, clients: { name: "Frío Industrial S.R.L.", province: "Buenos Aires", segment: "Industrial" }, interaction_lines: [] },
  { id: "i18", client_id: "c4", user_id: DEMO_SELLER.id, result: "no_interesado", total_amount: null, currency: "ARS", interaction_date: "2026-04-22", follow_up_date: null, notes: "Presupuesto muy alto para su presupuesto", estimated_loss: 350000, clients: { name: "Constructora Andes", province: "Mendoza", segment: "Construcción" }, interaction_lines: [] },
  { id: "i19", client_id: "c6", user_id: DEMO_SELLER.id, result: "no_interesado", total_amount: null, currency: "ARS", interaction_date: "2026-04-25", follow_up_date: null, notes: "Cambió de proveedor", estimated_loss: 250000, clients: { name: "Comercializadora Norte", province: "Tucumán", segment: "Comercio" }, interaction_lines: [] },
];

export const DEMO_PRODUCTS = [
  { id: "p1", name: "Semillas de pino", description: "Semillas de pino de alta germinación", price: 4250, currency: "ARS", unit: "kg", active: true },
  { id: "p2", name: "Semillas de eucalipto", description: "Eucalyptus grandis — zona NEA", price: 2400, currency: "ARS", unit: "kg", active: true },
  { id: "p3", name: "Madera laminada", description: "Laminado estructural certificado FSC", price: 30000, currency: "ARS", unit: "m³", active: true },
  { id: "p4", name: "Servicio fumigación", description: "Fumigación aérea y terrestre", price: 620000, currency: "ARS", unit: "lote", active: true },
  { id: "p5", name: "Árboles ornamentales", description: "Jacarandá, lapacho, tipa", price: 3500, currency: "ARS", unit: "unidad", active: true },
];
