import type { ClienteRecord, PersonaRecord } from '@mejora/nucleo';

export function isElectronLocal(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).suite?.db);
}

export async function fetchContactosFromSqlite(): Promise<ClienteRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.contactos?.getClientes) {
    return await (window as any).suite.db.contactos.getClientes();
  }
  if (typeof window !== 'undefined' && (window as any).suite?.db?.getClientes) {
    return await (window as any).suite.db.getClientes();
  }
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.getClientes();
  } catch (err) {
    console.warn('[Contactos NucleoAdapter] Fallback clientes:', err);
    return [];
  }
}

export async function fetchPersonasFromSqlite(): Promise<PersonaRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.contactos?.getPersonas) {
    return await (window as any).suite.db.contactos.getPersonas();
  }
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.getPersonas();
  } catch (err) {
    console.warn('[Contactos NucleoAdapter] Fallback personas:', err);
    return [];
  }
}

export async function createPersonaInSqlite(persona: Partial<PersonaRecord>): Promise<PersonaRecord | null> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.contactos?.createPersona) {
    return await (window as any).suite.db.contactos.createPersona(persona);
  }
  try {
    const nucleo = await import('@mejora/nucleo');
    return nucleo.createPersona(persona);
  } catch (err) {
    console.error('[Contactos NucleoAdapter] Error creando persona en SQLite:', err);
    return null;
  }
}
