import type { SmPropuestaRecord, SmCanalRecord, SmMetricaRecord } from '@mejora/nucleo';

export function isElectronLocal(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).suite?.db?.sm);
}

export async function fetchPropuestasFromSqlite(): Promise<SmPropuestaRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.sm?.getPropuestas) {
    try {
      return await (window as any).suite.db.sm.getPropuestas();
    } catch (err) {
      console.error('[SM NucleoAdapter] Error al obtener propuestas de SQLite:', err);
    }
  }
  return [];
}

export async function createPropuestaInSqlite(
  propuesta: Partial<SmPropuestaRecord>
): Promise<SmPropuestaRecord | null> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.sm?.createPropuesta) {
    try {
      return await (window as any).suite.db.sm.createPropuesta(propuesta);
    } catch (err) {
      console.error('[SM NucleoAdapter] Error al crear propuesta en SQLite:', err);
    }
  }
  return null;
}

export async function fetchCanalesFromSqlite(): Promise<SmCanalRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.sm?.getCanales) {
    try {
      return await (window as any).suite.db.sm.getCanales();
    } catch (err) {
      console.error('[SM NucleoAdapter] Error al obtener canales de SQLite:', err);
    }
  }
  return [];
}

export async function fetchMetricasFromSqlite(propuestaId?: number): Promise<SmMetricaRecord[]> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.sm?.getMetricas) {
    try {
      return await (window as any).suite.db.sm.getMetricas(propuestaId);
    } catch (err) {
      console.error('[SM NucleoAdapter] Error al obtener metricas de SQLite:', err);
    }
  }
  return [];
}
