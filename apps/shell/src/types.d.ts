export interface WsStatusResponse {
  connected: boolean;
  waStatus: 'desconectado' | 'conectando' | 'escaneando_qr' | 'conectado' | 'reconectando' | string;
  phone: string | null;
  qr: string | null;
  session?: {
    id: number;
    session_name: string;
    status: string;
    qr_code?: string | null;
    phone?: string | null;
    creado_el?: string;
    actualizado_el?: string;
  };
}

export interface WsCarpeta {
  id: number;
  nombre: string;
  color?: string | null;
  creado_el?: string;
}

export interface WsMiembro {
  id: number;
  carpeta_id: number;
  persona_id?: number | null;
  telefono: string;
  agregado_el?: string;
}

export interface SuiteWaApi {
  getStatus: () => Promise<WsStatusResponse>;
  connect: () => Promise<{ ok: boolean; status?: string; error?: string }>;
  logout: () => Promise<{ ok: boolean }>;
  getCarpetas: () => Promise<WsCarpeta[]>;
  createCarpeta: (carpeta: { nombre: string; color?: string }) => Promise<WsCarpeta>;
  getMiembros: (carpetaId?: number) => Promise<WsMiembro[]>;
  createMiembro: (miembro: { carpeta_id: number; persona_id?: number | null; telefono: string }) => Promise<WsMiembro>;
}

declare global {
  interface Window {
    suite?: {
      open: (target: string, demoMode?: boolean) => Promise<any>;
      checkMejoraWs: () => Promise<boolean>;
      getTelemetry: () => Promise<any>;
      getDbStatus: () => Promise<any>;
      pingDb: () => Promise<any>;
      wa: SuiteWaApi;
      db: {
        getStatus: () => Promise<any>;
        getClientes: () => Promise<any[]>;
        createCliente: (cliente: any) => Promise<any>;
        getNegocios: () => Promise<any[]>;
        query: (sql: string, params?: any[]) => Promise<any[]>;
        crm: any;
        contactos: any;
        sm: any;
        wa: SuiteWaApi;
      };
      onTelemetryUpdate?: (callback: (data: any) => void) => () => void;
    };
  }
}
