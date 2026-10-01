export interface DbStatus {
  connected: boolean;
  tableCount: number;
  tables: string[];
  dbPath?: string;
}

export interface ClienteRecord {
  id: number;
  nombre: string;
  whatsapp?: string | null;
  instagram_tiktok?: string | null;
  empresa?: string | null;
  cargo?: string | null;
  tag?: 'frecuente' | 'ocasional' | null;
  notas?: string | null;
}

export interface NegocioRecord {
  id: number;
  nombre: string;
  rubro: string;
  moneda: string;
  catalogo_activo: 'producto' | 'servicio' | 'ambos';
}

export interface PipelineRecord {
  id: number;
  nombre: string;
  activo: number;
  creado_el?: string;
}

export interface EtapaRecord {
  id: number;
  pipeline_id: number;
  nombre: string;
  orden: number;
  color?: string | null;
  creado_el?: string;
}

export interface DealRecord {
  id: number;
  titulo: string;
  valor: number;
  moneda: string;
  etapa_id: number;
  cliente_id?: number | null;
  usuario_id?: number | null;
  probabilidad?: number | null;
  estado: 'abierto' | 'ganado' | 'perdido';
  fecha_cierre_esperada?: string | null;
  notas?: string | null;
  creado_el?: string;
  actualizado_el?: string;
}

export interface InteraccionRecord {
  id: number;
  tipo: 'llamada' | 'reunion' | 'whatsapp' | 'email' | 'nota' | 'tarea';
  deal_id?: number | null;
  cliente_id?: number | null;
  usuario_id?: number | null;
  titulo: string;
  descripcion?: string | null;
  fecha: string;
  completada: number;
}

export interface PersonaRecord {
  id: number;
  uuid: string;
  nombre: string;
  apellido?: string | null;
  empresa?: string | null;
  cargo?: string | null;
  scoring: number;
  estado_calidad: 'util' | 'dudoso' | 'inutil';
  notas?: string | null;
  creado_el?: string;
  actualizado_el?: string;
}

export interface ContactoCanalRecord {
  id: number;
  persona_id: number;
  tipo: 'telefono' | 'whatsapp' | 'email' | 'instagram' | 'linkedin' | 'otro';
  valor: string;
  es_principal: number;
  verificado: number;
  creado_el?: string;
}

export interface SmCanalRecord {
  id: number;
  plataforma: string;
  activo: number;
  cuenta_id?: string | null;
  creado_el?: string;
}

export interface SmPropuestaRecord {
  id: number;
  titulo: string;
  contenido: string;
  formato?: string | null;
  estado: 'borrador' | 'aprobado' | 'programado' | 'publicado' | 'rechazado';
  canal_id?: number | null;
  programado_el?: string | null;
  publicado_el?: string | null;
  creado_el?: string;
  actualizado_el?: string;
}

export interface SmMetricaRecord {
  id: number;
  propuesta_id: number;
  alcance: number;
  interacciones: number;
  clics: number;
  compartidos: number;
  registrado_el?: string;
}

export interface WsSesionRecord {
  id: number;
  session_name: string;
  status: string;
  qr_code?: string | null;
  phone?: string | null;
  creado_el?: string;
  actualizado_el?: string;
}

export interface WsCarpetaRecord {
  id: number;
  nombre: string;
  color?: string | null;
  creado_el?: string;
}

export interface WsMiembroRecord {
  id: number;
  carpeta_id: number;
  persona_id?: number | null;
  telefono: string;
  agregado_el?: string;
}

