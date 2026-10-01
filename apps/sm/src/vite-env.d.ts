/// <reference types="vite/client" />

declare global {
  interface Window {
    suite?: {
      open?: (target: string, demoMode?: boolean) => Promise<any>;
      checkMejoraWs?: () => Promise<boolean>;
      getTelemetry?: () => Promise<any>;
      getDbStatus?: () => Promise<any>;
      pingDb?: () => Promise<any>;
      ai?: {
        generate: (prompt: string, contexto_historico?: string) => Promise<{ success: boolean; text?: string; error?: string }>;
      };
      db?: {
        getStatus?: () => Promise<any>;
        getClientes?: () => Promise<any[]>;
        createCliente?: (cliente: any) => Promise<any>;
        getNegocios?: () => Promise<any[]>;
        query?: (sql: string, params?: any[]) => Promise<any[]>;
        crm?: any;
        contactos?: any;
        sm?: {
          getPropuestas: () => Promise<any[]>;
          createPropuesta: (propuesta: any) => Promise<any>;
          updatePropuestaEstado: (id: number, estado: string, fechaProgramada?: string) => Promise<any>;
          verificarHashPropuesta: (dataOrHash: any) => Promise<{ hash: string; exists: boolean; propuesta?: any }>;
          checkTimeoutPropuestas: () => Promise<{ affectedCount: number; affectedIds: number[] }>;
          forceZernioSync: () => Promise<{ success: boolean; procesadas?: number; publicadas?: number; fallidas?: number; error?: string }>;
          getCanales: () => Promise<any[]>;
          getMetricas: (propuestaId?: number) => Promise<any[]>;
        };
        wa?: any;
      };
      onTelemetryUpdate?: (callback: (data: any) => void) => () => void;
    };
  }
}

