import type { ClienteRecord, PersonaRecord } from '@mejora/nucleo/src/types';

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

export async function fetchContactosFromSqlite(): Promise<ClienteRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.contactos?.getClientes) {
    return await (window as any).suite.db.contactos.getClientes();
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
    empresa: p.buyerPersonaId || p.canalOrigen,
    cargo: p.estado,
    tag: 'frecuente',
    notas: p.email,
  }));
}

export async function fetchPersonasFromSqlite(): Promise<PersonaRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.contactos?.getPersonas) {
    return await (window as any).suite.db.contactos.getPersonas();
  }
  const prospectos = await fetchProspectosHttp();
  return prospectos.map((p, idx) => ({
    id: idx + 1,
    uuid: p.id,
    nombre: p.nombre,
    apellido: null,
    empresa: p.buyerPersonaId || p.canalOrigen,
    cargo: p.estado,
    scoring: p.estado === 'CERRADO_GANADO' ? 98 : p.estado === 'EN_SEGUIMIENTO' ? 90 : 82,
    estado_calidad: 'util',
    notas: p.piezaIdAtribucion ? `Pieza: ${p.piezaIdAtribucion} (${p.email})` : p.email,
    creado_el: p.createdAt,
  }));
}

export async function createPersonaInSqlite(persona: Partial<PersonaRecord>): Promise<PersonaRecord | null> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.contactos?.createPersona) {
    return await (window as any).suite.db.contactos.createPersona(persona);
  }
  try {
    const emailSlug = (persona.nombre || 'persona').toLowerCase().replace(/[^a-z0-9]/g, '') || 'contacto';
    const res = await fetch(NUCLEO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: [persona.nombre, persona.apellido].filter(Boolean).join(' ') || 'Nueva Persona Contactos',
        email: `${emailSlug}.${Date.now().toString().slice(-4)}@contactos.com.ar`,
        telefono: '+5493764998877',
        canalOrigen: 'base_propia_contactos',
        buyerPersonaId: 'SIN_PROFESIONALIZAR_LA_EMPRESA',
      }),
    });
    if (!res.ok) return null;
    const created = (await res.json()) as ProspectoHttpRecord;
    return {
      id: Date.now(),
      uuid: created.id,
      nombre: created.nombre,
      empresa: persona.empresa || 'Base Propia Contactos',
      cargo: created.estado,
      scoring: 88,
      estado_calidad: 'util',
      notas: created.email,
      creado_el: created.createdAt,
    };
  } catch (err) {
    console.error('[Contactos NucleoAdapter] Error creando persona en MejoraNucleo HTTP:', err);
    return null;
  }
}
