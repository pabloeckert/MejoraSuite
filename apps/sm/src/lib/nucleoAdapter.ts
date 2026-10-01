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

export async function updatePropuestaEstadoInSqlite(
  id: number,
  estado: string,
  fechaProgramada?: string
): Promise<SmPropuestaRecord | null> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.sm?.updatePropuestaEstado) {
    try {
      return await (window as any).suite.db.sm.updatePropuestaEstado(id, estado, fechaProgramada);
    } catch (err) {
      console.error('[SM NucleoAdapter] Error al actualizar estado de propuesta en SQLite:', err);
    }
  }
  return null;
}

export async function forceZernioSyncInSqlite(): Promise<{
  success: boolean;
  procesadas?: number;
  publicadas?: number;
  fallidas?: number;
  error?: string;
  detalles?: Array<{ id: number; estado: string; zernioPostId?: string; error?: string }>;
}> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.sm?.forceZernioSync) {
    try {
      return await (window as any).suite.db.sm.forceZernioSync();
    } catch (err: any) {
      console.error('[SM NucleoAdapter] Error al forzar sincronización Zernio:', err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'IPC suite.db.sm.forceZernioSync no disponible' };
}

export async function checkTimeoutPropuestasInSqlite(): Promise<{ affectedCount: number; affectedIds: number[] }> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.sm?.checkTimeoutPropuestas) {
    try {
      return await (window as any).suite.db.sm.checkTimeoutPropuestas();
    } catch (err) {
      console.error('[SM NucleoAdapter] Error al ejecutar chequeo de timeouts:', err);
    }
  }
  return { affectedCount: 0, affectedIds: [] };
}

export async function verificarHashPropuestaInSqlite(
  dataOrHash: any
): Promise<{ hash: string; exists: boolean; propuesta?: SmPropuestaRecord }> {
  if (typeof window !== 'undefined' && (window as any).suite?.db?.sm?.verificarHashPropuesta) {
    try {
      return await (window as any).suite.db.sm.verificarHashPropuesta(dataOrHash);
    } catch (err) {
      console.error('[SM NucleoAdapter] Error al verificar hash de propuesta:', err);
    }
  }
  return { hash: '', exists: false };
}

export async function generateAiCyborgContent(
  prompt: string,
  contexto_historico?: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  if (typeof window !== 'undefined' && window.suite?.ai?.generate) {
    try {
      return await window.suite.ai.generate(prompt, contexto_historico);
    } catch (err: any) {
      console.error('[SM NucleoAdapter] Error al invocar Gemini AI:', err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'IPC window.suite.ai.generate no está disponible en este entorno.' };
}

