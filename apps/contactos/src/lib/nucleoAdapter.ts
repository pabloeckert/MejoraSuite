import type { ClienteRecord } from '@mejora/nucleo';

export async function fetchContactosFromSqlite(): Promise<ClienteRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.getClientes) {
    return await (window as any).suite.db.getClientes();
  }
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.getClientes();
  } catch (err) {
    console.warn('[Contactos NucleoAdapter] Fallback:', err);
    return [];
  }
}
