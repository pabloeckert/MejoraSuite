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
