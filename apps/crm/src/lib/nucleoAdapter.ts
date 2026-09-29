import type { ClienteRecord, NegocioRecord } from '@mejora/nucleo';

export async function fetchClientesFromSqlite(): Promise<ClienteRecord[]> {
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

export async function createClienteInSqlite(cliente: Partial<ClienteRecord>): Promise<ClienteRecord | null> {
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
