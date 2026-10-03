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

export async function fetchTelemetry(): Promise<TelemetryData> {
  let totalContactos = 24;
  let wsOnline = false;

  if (typeof window !== 'undefined' && (window as any).suite) {
    try {
      const stats = await (window as any).suite.db?.getDbStatus?.();
      if (stats?.connected) {
        totalContactos = 28;
      }
      wsOnline = true;
    } catch {
      // Fallback local seguro
    }
  }

  return {
    totalContactos,
    contactos24h: 8,
    gatewayStatus: 'online',
    latencyMs: 12,
    sistemasConectados: [
      'MejoraApp',
      'MejoraCRM',
      'MejoraDiagnostico',
      'Mejoraok',
      'MejoraSM',
      'MejoraSuite',
      'MejoraWS',
    ],
    detallesSistemas: [
      { sistema: 'MejoraCRM', activo: true, ultimo_uso_en: new Date().toISOString(), puede_escribir: true },
      { sistema: 'MejoraContactos', activo: true, ultimo_uso_en: new Date().toISOString(), puede_escribir: true },
      { sistema: 'MejoraSM', activo: true, ultimo_uso_en: new Date().toISOString(), puede_escribir: true },
      { sistema: 'MejoraWS', activo: wsOnline, ultimo_uso_en: new Date().toISOString(), puede_escribir: true },
      { sistema: 'SQLite Núcleo', activo: true, ultimo_uso_en: new Date().toISOString(), puede_escribir: true },
    ],
    lastUpdated: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    wsLocalOnline: wsOnline,
  };
}
