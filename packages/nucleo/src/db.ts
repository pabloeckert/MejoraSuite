import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import { runMigrations } from './migrate'
import type { DbStatus, ClienteRecord, NegocioRecord } from './types'

let db: Database.Database | null = null
let currentDbPath: string = ''

function resolveDefaultDbPath(): string {
  if (process.env.MEJORA_DB_PATH) {
    return process.env.MEJORA_DB_PATH
  }
  try {
    // Intentar resolver app de Electron si está en ejecución
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const electron = require('electron')
    const app = electron.app || electron.remote?.app
    if (app && typeof app.getPath === 'function') {
      const userData = app.getPath('userData')
      return path.join(userData, 'nucleo.db')
    }
  } catch {
    // Electron no disponible en contexto Node estándar
  }
  const appData = process.env.APPDATA || process.env.LOCALAPPDATA || process.cwd()
  const suiteData = path.join(appData, 'MejoraSuite')
  if (!fs.existsSync(suiteData)) {
    try {
      fs.mkdirSync(suiteData, { recursive: true })
    } catch {}
  }
  return path.join(suiteData, 'nucleo.db')
}

function resolveDefaultMigrationsDir(): string {
  const candidates = [
    path.join(__dirname, '..', 'migrations'),
    path.join(__dirname, 'migrations'),
    path.join(process.cwd(), 'packages', 'nucleo', 'migrations'),
    path.join(process.cwd(), 'migrations')
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return path.join(__dirname, '..', 'migrations')
}

export function connectDatabase(customDbPath?: string, customMigrationsDir?: string): Database.Database {
  if (db) return db

  currentDbPath = customDbPath || resolveDefaultDbPath()
  const dbDir = path.dirname(currentDbPath)
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  db = new Database(currentDbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  const migrationsDir = customMigrationsDir || resolveDefaultMigrationsDir()
  if (fs.existsSync(migrationsDir)) {
    runMigrations(db, migrationsDir)
  }

  seedDemoDataIfEmpty()

  return db
}

export function getDatabase(): Database.Database | null {
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function getStatus(targetDb?: Database.Database): DbStatus {
  const activeDb = targetDb || db
  if (!activeDb) {
    return { connected: false, tableCount: 0, tables: [] }
  }

  const rows = activeDb
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != 'schema_migrations' ORDER BY name"
    )
    .all() as { name: string }[]

  return {
    connected: true,
    tableCount: rows.length,
    tables: rows.map((r) => r.name),
    dbPath: currentDbPath
  }
}

export function getClientes(): ClienteRecord[] {
  const activeDb = db || connectDatabase()
  return activeDb.prepare('SELECT id, nombre, whatsapp, instagram_tiktok, empresa, cargo, tag, notas FROM Cliente ORDER BY id DESC').all() as ClienteRecord[]
}

export function createCliente(cliente: Partial<ClienteRecord>): ClienteRecord {
  const activeDb = db || connectDatabase()
  const stmt = activeDb.prepare(
    'INSERT INTO Cliente (nombre, whatsapp, instagram_tiktok, empresa, cargo, tag, notas) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const info = stmt.run(
    cliente.nombre || 'Sin Nombre',
    cliente.whatsapp || null,
    cliente.instagram_tiktok || null,
    cliente.empresa || null,
    cliente.cargo || null,
    cliente.tag || 'ocasional',
    cliente.notas || null
  )
  return {
    id: Number(info.lastInsertRowid),
    nombre: cliente.nombre || 'Sin Nombre',
    whatsapp: cliente.whatsapp || null,
    instagram_tiktok: cliente.instagram_tiktok || null,
    empresa: cliente.empresa || null,
    cargo: cliente.cargo || null,
    tag: cliente.tag || 'ocasional',
    notas: cliente.notas || null
  }
}

export function getNegocios(): NegocioRecord[] {
  const activeDb = db || connectDatabase()
  return activeDb.prepare('SELECT id, nombre, rubro, moneda, catalogo_activo FROM Negocio ORDER BY id ASC').all() as NegocioRecord[]
}

export function createNegocio(negocio: Partial<NegocioRecord>): NegocioRecord {
  const activeDb = db || connectDatabase()
  const stmt = activeDb.prepare(
    'INSERT INTO Negocio (nombre, rubro, moneda, catalogo_activo) VALUES (?, ?, ?, ?)'
  )
  const info = stmt.run(
    negocio.nombre || 'Negocio Principal',
    negocio.rubro || 'General',
    negocio.moneda || 'ARS',
    negocio.catalogo_activo || 'ambos'
  )
  return {
    id: Number(info.lastInsertRowid),
    nombre: negocio.nombre || 'Negocio Principal',
    rubro: negocio.rubro || 'General',
    moneda: negocio.moneda || 'ARS',
    catalogo_activo: negocio.catalogo_activo || 'ambos'
  }
}

export function querySql<T = any>(sql: string, params: any[] = []): T[] {
  const activeDb = db || connectDatabase()
  return activeDb.prepare(sql).all(...params) as T[]
}

export function seedDemoDataIfEmpty(): void {
  if (!db) return

  const clientCount = (db.prepare('SELECT COUNT(*) as c FROM Cliente').get() as { c: number }).c
  if (clientCount === 0) {
    const insert = db.prepare(
      'INSERT INTO Cliente (nombre, whatsapp, instagram_tiktok, empresa, cargo, tag, notas) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    insert.run('Alvear Abogados SRL', '+5491145229001', '@alvearabogados', 'Estudio Alvear', 'Socio Gerente', 'frecuente', 'Cliente corporativo clave en MejoraSuite')
    insert.run('Distribuidora El Litoral', '+5493424118822', '@distrilitoral', 'El Litoral SA', 'Director Comercial', 'frecuente', 'Integrado con pipeline de WhatsApp y facturación')
    insert.run('Dra. Mariana Costa', '+5491167733221', '@dramarianacosta', 'Clínica Parque', 'Directora Médica', 'ocasional', 'Contacto originado en MejoraContactos')
  }

  const negocioCount = (db.prepare('SELECT COUNT(*) as c FROM Negocio').get() as { c: number }).c
  if (negocioCount === 0) {
    const insert = db.prepare('INSERT INTO Negocio (nombre, rubro, moneda, catalogo_activo) VALUES (?, ?, ?, ?)')
    insert.run('Mejora Continua Hub', 'Consultoría y Software', 'ARS', 'ambos')
  }
}
