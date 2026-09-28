import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import { runMigrations } from './migrate'
import type { DbStatus } from './types'

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
