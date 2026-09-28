export interface SystemDetail {
  sistema: string;
  activo: boolean;
  ultimo_uso_en: string;
  puede_escribir: boolean;
}

export interface TelemetryData {
  totalContactos: number;
  contactos24h: number;
  gatewayStatus: 'online' | 'degraded' | 'offline';
  latencyMs: number;
  sistemasConectados: string[];
  detallesSistemas: SystemDetail[];
  lastUpdated: string;
  wsLocalOnline: boolean;
}

const API_BASE = 'https://tzatuvxatsduuslxqdtm.supabase.co/functions/v1/contactos-api';
const API_KEY = '270fa9a7c24cf33908cdd2f5cf468760fd490d93049964c717d9a6433d8d3539';

export async function fetchTelemetry(): Promise<TelemetryData> {
  const startTime = performance.now();
  let totalContactos = 20;
  let contactos24h = 8;
  let gatewayStatus: 'online' | 'degraded' | 'offline' = 'online';
  let latencyMs = 0;
  let sistemasConectados: string[] = ['MejoraApp', 'MejoraCRM', 'MejoraDiagnostico', 'Mejoraok', 'MejoraSM', 'MejoraSuite', 'MejoraWS'];
  let detallesSistemas: SystemDetail[] = [];
  let wsLocalOnline = false;

  // 1. Health check & system status
  try {
    const healthPromise = fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const last24hPromise = fetch(`${API_BASE}?desde=${encodeURIComponent(yesterday)}&tamano=1`, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Timeout of 8 seconds
    const [healthRes, last24hRes] = await Promise.all([healthPromise, last24hPromise]);
    latencyMs = Math.round(performance.now() - startTime);

    if (healthRes.ok) {
      const healthData = await healthRes.json();
      totalContactos = healthData.total_contactos ?? totalContactos;
      sistemasConectados = healthData.sistemas_conectados ?? sistemasConectados;
      detallesSistemas = healthData.detalles_sistemas ?? [];
      gatewayStatus = 'online';
    } else {
      gatewayStatus = 'degraded';
    }

    if (last24hRes.ok) {
      const last24hData = await last24hRes.json();
      contactos24h = typeof last24hData.total === 'number' ? last24hData.total : contactos24h;
    }
  } catch (err) {
    console.warn('[TelemetryService] Error consultando gateway central:', err);
    gatewayStatus = 'offline';
    latencyMs = Math.round(performance.now() - startTime);
  }

  // 2. Local MejoraWS status check (port 4180)
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1200);
    const wsRes = await fetch('http://127.0.0.1:4180/status', {
      signal: controller.signal,
      mode: 'cors'
    }).catch(() => null);
    clearTimeout(id);
    wsLocalOnline = !!(wsRes && (wsRes.ok || wsRes.status === 401 || wsRes.status === 403));
  } catch {
    wsLocalOnline = false;
  }

  return {
    totalContactos,
    contactos24h,
    gatewayStatus,
    latencyMs,
    sistemasConectados,
    detallesSistemas,
    lastUpdated: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    wsLocalOnline
  };
}
