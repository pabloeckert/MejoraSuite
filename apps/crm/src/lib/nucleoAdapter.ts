import type { ClienteRecord, NegocioRecord, DealRecord, PipelineRecord, EtapaRecord } from '@mejora/nucleo';

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
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.getClientes();
  } catch (err) {
    console.warn('[CRM NucleoAdapter] Fallback en entorno sin acceso directo a Node:', err);
    return [];
  }
}

export async function createClienteInSqlite(cliente: Partial<ClienteRecord>): Promise<ClienteRecord | null> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.createCliente) {
    return await (window as any).suite.db.crm.createCliente(cliente);
  }
  if (typeof window !== 'undefined' && (window as any).suite?.db?.createCliente) {
    return await (window as any).suite.db.createCliente(cliente);
  }
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.createCliente(cliente);
  } catch (err) {
    console.error('[CRM NucleoAdapter] Error creando cliente en SQLite:', err);
    return null;
  }
}

export async function fetchDealsFromSqlite(): Promise<DealRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.getDeals) {
    return await (window as any).suite.db.crm.getDeals();
  }
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.getDeals();
  } catch (err) {
    console.warn('[CRM NucleoAdapter] Fallback deals:', err);
    return [];
  }
}

export async function createDealInSqlite(deal: Partial<DealRecord>): Promise<DealRecord | null> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.createDeal) {
    return await (window as any).suite.db.crm.createDeal(deal);
  }
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.createDeal(deal);
  } catch (err) {
    console.error('[CRM NucleoAdapter] Error creando deal en SQLite:', err);
    return null;
  }
}

export async function fetchPipelinesFromSqlite(): Promise<PipelineRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.getPipelines) {
    return await (window as any).suite.db.crm.getPipelines();
  }
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.getPipelines();
  } catch (err) {
    console.warn('[CRM NucleoAdapter] Fallback pipelines:', err);
    return [];
  }
}

export async function fetchEtapasFromSqlite(pipelineId?: number): Promise<EtapaRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.crm?.getEtapas) {
    return await (window as any).suite.db.crm.getEtapas(pipelineId);
  }
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.getEtapas(pipelineId);
  } catch (err) {
    console.warn('[CRM NucleoAdapter] Fallback etapas:', err);
    return [];
  }
}

export async function fetchNegociosFromSqlite(): Promise<NegocioRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.getNegocios) {
    return await (window as any).suite.db.getNegocios();
  }
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.getNegocios();
  } catch (err) {
    console.warn('[CRM NucleoAdapter] Fallback negocios:', err);
    return [];
  }
}
