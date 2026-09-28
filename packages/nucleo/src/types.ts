export interface DbStatus {
  connected: boolean;
  tableCount: number;
  tables: string[];
  dbPath?: string;
}
