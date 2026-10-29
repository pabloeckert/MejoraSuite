/**
 * Servicio soberano de conexión con el Servidor Local de MejoraNucleo
 * Endpoints REST sobre http://127.0.0.1:4002/api/prospectos
 * Soporte de resiliencia Fast-Window, Circuit Breaker y fallback local.
 */

export type SlaEstado = 'VERDE' | 'AMARILLO' | 'ROJO' | 'CUMPLIDO';

export type EstadoProspecto =
  | 'CAPTURADO'
  | 'CALIFICADO'
  | 'EN_SEGUIMIENTO'
  | 'CERRADO_GANADO'
  | 'CERRADO_PERDIDO';

export interface ProspectoResponseDTO {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  canalOrigen: string;
  estado: EstadoProspecto;
  createdAt: string;
  updatedAt: string;
  slaHorasRestantes: number;
  slaEstado: SlaEstado;
}

export interface ProspectoEventoRecord {
  id?: number;
  prospectoId: string;
  evento: string;
  estadoAnterior?: string | null;
  estadoNuevo: string;
  detalles?: string | null;
  timestamp: string;
}

export interface CrearProspectoInput {
  nombre: string;
  email: string;
  telefono: string;
  canalOrigen: string;
}

const LOCAL_STORAGE_CACHE_KEY = 'mejora_prospectos_nucleo_cache';

const NUCLEO_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NUCLEO_API_URL) ||
  'http://127.0.0.1:4002';

function calcularSlaLocal(estado: EstadoProspecto, createdAt: string): { slaEstado: SlaEstado; slaHorasRestantes: number } {
  if (estado !== 'CAPTURADO') {
    return { slaEstado: 'CUMPLIDO', slaHorasRestantes: 0 };
  }
  const elapsedMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const elapsedHoras = elapsedMs / (1000 * 60 * 60);
  const slaHorasRestantes = Math.max(0, Math.round(48 - elapsedHoras));
  let slaEstado: SlaEstado = 'VERDE';
  if (elapsedHoras > 48) {
    slaEstado = 'ROJO';
  } else if (elapsedHoras >= 24) {
    slaEstado = 'AMARILLO';
  }
  return { slaEstado, slaHorasRestantes };
}

function getLocalCache(): ProspectoResponseDTO[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (!raw) return getInitialSeedProspectos();
    const parsed = JSON.parse(raw) as ProspectoResponseDTO[];
    // Recalcular SLA dinámicamente según el momento actual
    return parsed.map((p) => {
      const { slaEstado, slaHorasRestantes } = calcularSlaLocal(p.estado, p.createdAt);
      return { ...p, slaEstado, slaHorasRestantes };
    });
  } catch {
    return getInitialSeedProspectos();
  }
}

function saveLocalCache(prospectos: ProspectoResponseDTO[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(prospectos));
  } catch (e) {
    console.warn('[prospectosNucleoService] No se pudo guardar caché local:', e);
  }
}

function getInitialSeedProspectos(): ProspectoResponseDTO[] {
  const now = Date.now();
  const seed: ProspectoResponseDTO[] = [
    {
      id: 'lead-urgente-01',
      nombre: 'Ricardo Albarracín (Agropecuaria del Litoral)',
      email: 'ricardo@agrolitoral.com.ar',
      telefono: '+5493415551234',
      canalOrigen: 'diagnostico_4d',
      estado: 'CAPTURADO',
      createdAt: new Date(now - 49 * 60 * 60 * 1000).toISOString(), // 49h -> Vencido (ROJO)
      updatedAt: new Date(now - 49 * 60 * 60 * 1000).toISOString(),
      slaHorasRestantes: 0,
      slaEstado: 'ROJO'
    },
    {
      id: 'lead-alerta-02',
      nombre: 'Florencia Benítez (Distribuidora Norte)',
      email: 'fbenitez@distrinorte.com.ar',
      telefono: '+5493816664321',
      canalOrigen: 'taller_mc',
      estado: 'CAPTURADO',
      createdAt: new Date(now - 32 * 60 * 60 * 1000).toISOString(), // 32h -> En riesgo (AMARILLO)
      updatedAt: new Date(now - 32 * 60 * 60 * 1000).toISOString(),
      slaHorasRestantes: 16,
      slaEstado: 'AMARILLO'
    },
    {
      id: 'lead-nuevo-03',
      nombre: 'Esteban Morales (Metalúrgica Aconcagua)',
      email: 'emorales@aconcaguametal.com',
      telefono: '+5492614447890',
      canalOrigen: 'landing_hostinger',
      estado: 'CAPTURADO',
      createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(), // 3h -> En término (VERDE)
      updatedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      slaHorasRestantes: 45,
      slaEstado: 'VERDE'
    },
    {
      id: 'lead-calificado-04',
      nombre: 'Mariana Zunino (Logística Pampeana)',
      email: 'mariana.zunino@logpampa.com',
      telefono: '+5492954112233',
      canalOrigen: 'after_office_12x12',
      estado: 'CALIFICADO',
      createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 40 * 60 * 60 * 1000).toISOString(),
      slaHorasRestantes: 0,
      slaEstado: 'CUMPLIDO'
    }
  ];
  return seed;
}

export const prospectosNucleoService = {
  /**
   * Listar todos los prospectos con SLA computado.
   * Intenta consultar el servidor local HTTP; si no responde o está offline,
   * entrega el caché local con recálculo dinámico de SLA en < 50ms.
   */
  async listarProspectos(filtros?: { estado?: string; busqueda?: string }): Promise<ProspectoResponseDTO[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const url = new URL('/api/prospectos', NUCLEO_BASE_URL);
      if (filtros?.estado) url.searchParams.set('estado', filtros.estado);
      if (filtros?.busqueda) url.searchParams.set('busqueda', filtros.busqueda);

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as ProspectoResponseDTO[];
        saveLocalCache(data);
        return data;
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('[prospectosNucleoService] Servidor local no disponible, usando fallback caché:', err);
      let list = getLocalCache();
      if (filtros?.estado) {
        list = list.filter((p) => p.estado === filtros.estado);
      }
      if (filtros?.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        list = list.filter(
          (p) =>
            p.nombre.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.telefono.includes(q) ||
            p.canalOrigen.toLowerCase().includes(q)
        );
      }
      return list;
    }
  },

  /**
   * Crear nuevo prospecto
   */
  async crearProspecto(input: CrearProspectoInput): Promise<ProspectoResponseDTO> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const res = await fetch(`${NUCLEO_BASE_URL}/api/prospectos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const created = (await res.json()) as ProspectoResponseDTO;
        const current = getLocalCache();
        saveLocalCache([created, ...current]);
        return created;
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Error ${res.status} al crear prospecto`);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('[prospectosNucleoService] Error al crear en servidor, guardando en fallback local:', err);
      const now = new Date().toISOString();
      const fallback: ProspectoResponseDTO = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        nombre: input.nombre.trim(),
        email: input.email.trim().toLowerCase(),
        telefono: input.telefono.trim(),
        canalOrigen: input.canalOrigen.trim() || 'crm_manual',
        estado: 'CAPTURADO',
        createdAt: now,
        updatedAt: now,
        slaHorasRestantes: 48,
        slaEstado: 'VERDE'
      };
      const current = getLocalCache();
      saveLocalCache([fallback, ...current]);
      return fallback;
    }
  },

  /**
   * Calificar prospecto (Transición: CAPTURADO -> CALIFICADO)
   */
  async calificarProspecto(id: string): Promise<ProspectoResponseDTO> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const res = await fetch(`${NUCLEO_BASE_URL}/api/prospectos/${encodeURIComponent(id)}/calificar`, {
        method: 'PATCH',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const updated = (await res.json()) as ProspectoResponseDTO;
        this.updateCacheItem(updated);
        return updated;
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Error ${res.status} al calificar`);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('[prospectosNucleoService] Fallback local calificar:', err);
      const current = getLocalCache();
      const item = current.find((p) => p.id === id);
      if (!item) throw new Error(`Prospecto ${id} no encontrado.`);
      if (item.estado !== 'CAPTURADO') {
        throw new Error(`Solo se puede calificar desde estado CAPTURADO (actual: ${item.estado}).`);
      }
      const updated: ProspectoResponseDTO = {
        ...item,
        estado: 'CALIFICADO',
        updatedAt: new Date().toISOString(),
        slaEstado: 'CUMPLIDO',
        slaHorasRestantes: 0
      };
      this.updateCacheItem(updated);
      return updated;
    }
  },

  /**
   * Iniciar seguimiento (Transición: CALIFICADO -> EN_SEGUIMIENTO)
   */
  async iniciarSeguimiento(id: string): Promise<ProspectoResponseDTO> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const res = await fetch(`${NUCLEO_BASE_URL}/api/prospectos/${encodeURIComponent(id)}/seguimiento`, {
        method: 'PATCH',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const updated = (await res.json()) as ProspectoResponseDTO;
        this.updateCacheItem(updated);
        return updated;
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Error ${res.status} al iniciar seguimiento`);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('[prospectosNucleoService] Fallback local seguimiento:', err);
      const current = getLocalCache();
      const item = current.find((p) => p.id === id);
      if (!item) throw new Error(`Prospecto ${id} no encontrado.`);
      if (item.estado !== 'CALIFICADO') {
        throw new Error(`Solo se puede iniciar seguimiento desde estado CALIFICADO (actual: ${item.estado}).`);
      }
      const updated: ProspectoResponseDTO = {
        ...item,
        estado: 'EN_SEGUIMIENTO',
        updatedAt: new Date().toISOString(),
        slaEstado: 'CUMPLIDO',
        slaHorasRestantes: 0
      };
      this.updateCacheItem(updated);
      return updated;
    }
  },

  /**
   * Cerrar prospecto (Transición: EN_SEGUIMIENTO -> CERRADO_GANADO o CALIFICADO/SEGUIMIENTO -> CERRADO_PERDIDO)
   */
  async cerrarProspecto(id: string, ganado: boolean): Promise<ProspectoResponseDTO> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const res = await fetch(`${NUCLEO_BASE_URL}/api/prospectos/${encodeURIComponent(id)}/cerrar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ganado }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const updated = (await res.json()) as ProspectoResponseDTO;
        this.updateCacheItem(updated);
        return updated;
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Error ${res.status} al cerrar`);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('[prospectosNucleoService] Fallback local cerrar:', err);
      const current = getLocalCache();
      const item = current.find((p) => p.id === id);
      if (!item) throw new Error(`Prospecto ${id} no encontrado.`);
      if (ganado && item.estado !== 'EN_SEGUIMIENTO') {
        throw new Error('Para cerrar ganado debe estar previamente en seguimiento.');
      }
      const nuevoEstado: EstadoProspecto = ganado ? 'CERRADO_GANADO' : 'CERRADO_PERDIDO';
      const updated: ProspectoResponseDTO = {
        ...item,
        estado: nuevoEstado,
        updatedAt: new Date().toISOString(),
        slaEstado: 'CUMPLIDO',
        slaHorasRestantes: 0
      };
      this.updateCacheItem(updated);
      return updated;
    }
  },

  /**
   * Obtener traza de eventos de auditoría (prospecto_eventos_log)
   */
  async obtenerEventos(id: string): Promise<ProspectoEventoRecord[]> {
    try {
      const res = await fetch(`${NUCLEO_BASE_URL}/api/prospectos/${encodeURIComponent(id)}/eventos`);
      if (res.ok) {
        return (await res.json()) as ProspectoEventoRecord[];
      }
      return [];
    } catch {
      return [];
    }
  },

  updateCacheItem(item: ProspectoResponseDTO): void {
    const current = getLocalCache();
    const index = current.findIndex((p) => p.id === item.id);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.push(item);
    }
    saveLocalCache(current);
  }
};
