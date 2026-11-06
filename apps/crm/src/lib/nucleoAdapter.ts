import type { ClienteRecord, NegocioRecord, DealRecord, PipelineRecord, EtapaRecord } from '@mejora/nucleo/src/types';

const NUCLEO_API_URL = 'http://127.0.0.1:4002/api/prospectos';

interface ProspectoHttpRecord {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  canalOrigen: string;
  estado: string;
  piezaIdAtribucion?: string;
  buyerPersonaId?: string;
  createdAt: string;
}

async function fetchProspectosHttp(): Promise<ProspectoHttpRecord[]> {
  try {
    const res = await fetch(NUCLEO_API_URL);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function isElectronLocal(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).suite?.db);
}

export async function fetchClientesFromSqlite(): Promise<ClienteRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.getClientes) {
    return await (window as any).suite.db.crm.getClientes();
  }
  if (typeof window !== 'undefined' && (window as any).suite?.db?.getClientes) {
    return await (window as any).suite.db.getClientes();
  }
  const prospectos = await fetchProspectosHttp();
  return prospectos.map((p, idx) => ({
    id: idx + 1,
    nombre: p.nombre,
    whatsapp: p.telefono || null,
    instagram_tiktok: p.canalOrigen || null,
    empresa: p.buyerPersonaId || p.canalOrigen || 'Ecosistema Mejora Continua',
    cargo: p.estado,
    tag: p.estado === 'CERRADO_GANADO' || p.estado === 'EN_SEGUIMIENTO' ? 'frecuente' : 'ocasional',
    notas: p.piezaIdAtribucion ? `Pieza: ${p.piezaIdAtribucion} | Email: ${p.email}` : p.email,
  }));
}

export async function createClienteInSqlite(cliente: Partial<ClienteRecord>): Promise<ClienteRecord | null> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.createCliente) {
    return await (window as any).suite.db.crm.createCliente(cliente);
  }
  if (typeof window !== 'undefined' && (window as any).suite?.db?.createCliente) {
    return await (window as any).suite.db.createCliente(cliente);
  }
  try {
    const emailSlug = (cliente.nombre || 'lead').toLowerCase().replace(/[^a-z0-9]/g, '') || 'contacto';
    const res = await fetch(NUCLEO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: cliente.nombre || 'Nuevo Prospecto CRM',
        email: `${emailSlug}.${Date.now().toString().slice(-4)}@empresa.com.ar`,
        telefono: cliente.whatsapp || '+5493764000000',
        canalOrigen: 'crm_suite_hub',
        buyerPersonaId: 'SATURADO',
      }),
    });
    if (!res.ok) return null;
    const created = (await res.json()) as ProspectoHttpRecord;
    return {
      id: Date.now(),
      nombre: created.nombre,
      whatsapp: created.telefono,
      empresa: cliente.empresa || 'CRM Suite Local',
      cargo: created.estado,
      tag: 'frecuente',
      notas: created.email,
    };
  } catch (err) {
    console.error('[CRM NucleoAdapter] Error creando cliente en MejoraNucleo HTTP:', err);
    return null;
  }
}

export async function fetchDealsFromSqlite(): Promise<DealRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.getDeals) {
    return await (window as any).suite.db.crm.getDeals();
  }
  const prospectos = await fetchProspectosHttp();
  return prospectos.map((p, idx) => ({
    id: idx + 1,
    titulo: `Programa Profesionalización — ${p.nombre}`,
    valor: p.estado === 'CERRADO_GANADO' ? 1800 : 1500,
    moneda: 'USD',
    etapa_id: p.estado === 'CAPTURADO' ? 1 : p.estado === 'CALIFICADO' ? 2 : p.estado === 'EN_SEGUIMIENTO' ? 3 : 4,
    estado: p.estado === 'CERRADO_GANADO' ? 'ganado' : p.estado === 'CERRADO_PERDIDO' ? 'perdido' : 'abierto',
    notas: p.piezaIdAtribucion || p.canalOrigen,
    creado_el: p.createdAt,
  }));
}

export async function createDealInSqlite(deal: Partial<DealRecord>): Promise<DealRecord | null> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.createDeal) {
    return await (window as any).suite.db.crm.createDeal(deal);
  }
  return {
    id: Date.now(),
    titulo: deal.titulo || 'Nuevo Deal Comercial',
    valor: deal.valor || 1500,
    moneda: deal.moneda || 'USD',
    etapa_id: deal.etapa_id || 1,
    estado: 'abierto',
  };
}

export async function fetchPipelinesFromSqlite(): Promise<PipelineRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.getPipelines) {
    return await (window as any).suite.db.crm.getPipelines();
  }
  return [{ id: 1, nombre: 'Pipeline Edificio Comercial (SLA 48h)', activo: 1 }];
}

export async function fetchEtapasFromSqlite(pipelineId?: number): Promise<EtapaRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.getEtapas) {
    return await (window as any).suite.db.crm.getEtapas(pipelineId);
  }
  return [
    { id: 1, pipeline_id: pipelineId || 1, nombre: 'CAPTURADO (<48h)', orden: 1 },
    { id: 2, pipeline_id: pipelineId || 1, nombre: 'CALIFICADO', orden: 2 },
    { id: 3, pipeline_id: pipelineId || 1, nombre: 'EN_SEGUIMIENTO', orden: 3 },
    { id: 4, pipeline_id: pipelineId || 1, nombre: 'CERRADO_GANADO', orden: 4 },
  ];
}

export async function fetchNegociosFromSqlite(): Promise<NegocioRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.getNegocios) {
    return await (window as any).suite.db.getNegocios();
  }
  return [
    {
      id: 1,
      nombre: 'Mejora Continua — Consultoría & Profesionalización',
      rubro: 'Consultoría B2B',
      moneda: 'USD',
      catalogo_activo: 'servicio',
    },
  ];
}
