import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import Database from 'better-sqlite3'
import { runMigrations } from './migrate'
import type {
  DbStatus,
  ClienteRecord,
  NegocioRecord,
  PipelineRecord,
  EtapaRecord,
  DealRecord,
  InteraccionRecord,
  PersonaRecord,
  ContactoCanalRecord,
  SmCanalRecord,
  SmPropuestaRecord,
  SmPropuestaEstado,
  SmTimeoutCheckResult,
  SmMetricaRecord,
  WsSesionRecord,
  WsCarpetaRecord,
  WsMiembroRecord
} from './types'

let db: Database.Database | null = null
let currentDbPath: string = ''

function resolveDefaultDbPath(): string {
  if (process.env.MEJORA_DB_PATH) {
    return process.env.MEJORA_DB_PATH
  }
  try {
    // Intentar resolver app de Electron si esta en ejecucion
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const electron = require('electron')
    const app = electron.app || electron.remote?.app
    if (app && typeof app.getPath === 'function') {
      const userData = app.getPath('userData')
      return path.join(userData, 'nucleo.db')
    }
  } catch {
    // Electron no disponible en contexto Node estandar
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
  db.pragma('synchronous = NORMAL')
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

// ==========================================
// Clientes
// ==========================================
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

// ==========================================
// Negocios
// ==========================================
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

// ==========================================
// CRM: Pipelines, Etapas y Deals
// ==========================================
export function getPipelines(): PipelineRecord[] {
  const activeDb = db || connectDatabase()
  return activeDb.prepare('SELECT id, nombre, activo, creado_el FROM Pipeline ORDER BY id ASC').all() as PipelineRecord[]
}

export function getEtapas(pipelineId?: number): EtapaRecord[] {
  const activeDb = db || connectDatabase()
  if (pipelineId) {
    return activeDb
      .prepare('SELECT id, pipeline_id, nombre, orden, color, creado_el FROM Etapa WHERE pipeline_id = ? ORDER BY orden ASC')
      .all(pipelineId) as EtapaRecord[]
  }
  return activeDb
    .prepare('SELECT id, pipeline_id, nombre, orden, color, creado_el FROM Etapa ORDER BY pipeline_id ASC, orden ASC')
    .all() as EtapaRecord[]
}

export function getDeals(): DealRecord[] {
  const activeDb = db || connectDatabase()
  return activeDb
    .prepare(
      'SELECT id, titulo, valor, moneda, etapa_id, cliente_id, usuario_id, probabilidad, estado, fecha_cierre_esperada, notas, creado_el, actualizado_el FROM Deal ORDER BY id DESC'
    )
    .all() as DealRecord[]
}

export function createDeal(deal: Partial<DealRecord>): DealRecord {
  const activeDb = db || connectDatabase()
  const stmt = activeDb.prepare(
    'INSERT INTO Deal (titulo, valor, moneda, etapa_id, cliente_id, usuario_id, probabilidad, estado, fecha_cierre_esperada, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const info = stmt.run(
    deal.titulo || 'Nuevo Deal',
    deal.valor ?? 0,
    deal.moneda || 'ARS',
    deal.etapa_id || 1,
    deal.cliente_id ?? null,
    deal.usuario_id ?? null,
    deal.probabilidad ?? 50,
    deal.estado || 'abierto',
    deal.fecha_cierre_esperada ?? null,
    deal.notas ?? null
  )
  return {
    id: Number(info.lastInsertRowid),
    titulo: deal.titulo || 'Nuevo Deal',
    valor: deal.valor ?? 0,
    moneda: deal.moneda || 'ARS',
    etapa_id: deal.etapa_id || 1,
    cliente_id: deal.cliente_id ?? null,
    usuario_id: deal.usuario_id ?? null,
    probabilidad: deal.probabilidad ?? 50,
    estado: deal.estado || 'abierto',
    fecha_cierre_esperada: deal.fecha_cierre_esperada ?? null,
    notas: deal.notas ?? null
  }
}

// ==========================================
// Contactos: Personas y Canales
// ==========================================
export function getPersonas(): PersonaRecord[] {
  const activeDb = db || connectDatabase()
  return activeDb
    .prepare(
      'SELECT id, uuid, nombre, apellido, empresa, cargo, scoring, estado_calidad, notas, creado_el, actualizado_el FROM Persona ORDER BY id DESC'
    )
    .all() as PersonaRecord[]
}

export function createPersona(persona: Partial<PersonaRecord>): PersonaRecord {
  const activeDb = db || connectDatabase()
  const uuid =
    persona.uuid ||
    (typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `p-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)
  const stmt = activeDb.prepare(
    'INSERT INTO Persona (uuid, nombre, apellido, empresa, cargo, scoring, estado_calidad, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const info = stmt.run(
    uuid,
    persona.nombre || 'Sin Nombre',
    persona.apellido ?? null,
    persona.empresa ?? null,
    persona.cargo ?? null,
    persona.scoring ?? 50,
    persona.estado_calidad || 'util',
    persona.notas ?? null
  )
  return {
    id: Number(info.lastInsertRowid),
    uuid,
    nombre: persona.nombre || 'Sin Nombre',
    apellido: persona.apellido ?? null,
    empresa: persona.empresa ?? null,
    cargo: persona.cargo ?? null,
    scoring: persona.scoring ?? 50,
    estado_calidad: persona.estado_calidad || 'util',
    notas: persona.notas ?? null
  }
}

// ==========================================
// Social Media (MejoraSM): Blindaje, Idempotencia y Estados
// ==========================================

export function computePropuestaHash(data: {
  titulo?: string;
  contenido?: string;
  canal_id?: number | null;
  programado_el?: string | null;
}): string {
  const normal = `${(data.titulo || '').trim().toLowerCase()}|${(data.contenido || '').trim()}|${data.canal_id ?? ''}|${data.programado_el ?? ''}`
  return crypto.createHash('sha256').update(normal).digest('hex')
}

export function findPropuestaByHash(hash: string): SmPropuestaRecord | null {
  const activeDb = db || connectDatabase()
  const row = activeDb
    .prepare(
      'SELECT id, titulo, contenido, formato, estado, canal_id, hash_unico, programado_el, publicado_el, creado_el, actualizado_el FROM sm_propuestas WHERE hash_unico = ?'
    )
    .get(hash) as SmPropuestaRecord | undefined
  return row || null
}

export function getPropuestaById(id: number): SmPropuestaRecord | null {
  const activeDb = db || connectDatabase()
  const row = activeDb
    .prepare(
      'SELECT id, titulo, contenido, formato, estado, canal_id, hash_unico, programado_el, publicado_el, creado_el, actualizado_el FROM sm_propuestas WHERE id = ?'
    )
    .get(id) as SmPropuestaRecord | undefined
  return row || null
}

export function getPropuestas(): SmPropuestaRecord[] {
  const activeDb = db || connectDatabase()
  return activeDb
    .prepare(
      'SELECT id, titulo, contenido, formato, estado, canal_id, hash_unico, programado_el, publicado_el, creado_el, actualizado_el FROM sm_propuestas ORDER BY id DESC'
    )
    .all() as SmPropuestaRecord[]
}

export function createPropuesta(propuesta: Partial<SmPropuestaRecord>): SmPropuestaRecord {
  const activeDb = db || connectDatabase()
  const hash = propuesta.hash_unico || computePropuestaHash(propuesta)

  // Blindaje de Idempotencia: previene duplicados por doble click o reenvío masivo
  const existing = findPropuestaByHash(hash)
  if (existing) {
    return existing
  }

  const stmt = activeDb.prepare(
    'INSERT INTO sm_propuestas (titulo, contenido, formato, estado, canal_id, hash_unico, programado_el, publicado_el) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const info = stmt.run(
    propuesta.titulo || 'Sin Título',
    propuesta.contenido || '',
    propuesta.formato || 'post',
    propuesta.estado || 'borrador',
    propuesta.canal_id ?? null,
    hash,
    propuesta.programado_el ?? null,
    propuesta.publicado_el ?? null
  )
  return {
    id: Number(info.lastInsertRowid),
    titulo: propuesta.titulo || 'Sin Título',
    contenido: propuesta.contenido || '',
    formato: propuesta.formato || 'post',
    estado: (propuesta.estado as SmPropuestaEstado) || 'borrador',
    canal_id: propuesta.canal_id ?? null,
    hash_unico: hash,
    programado_el: propuesta.programado_el ?? null,
    publicado_el: propuesta.publicado_el ?? null,
    creado_el: new Date().toISOString(),
    actualizado_el: new Date().toISOString()
  }
}

export function updatePropuestaEstado(
  id: number,
  nuevoEstado: SmPropuestaEstado,
  fechaProgramada?: string | null
): SmPropuestaRecord | null {
  const activeDb = db || connectDatabase()
  const existing = getPropuestaById(id)
  if (!existing) return null

  if (nuevoEstado === 'programado' && fechaProgramada !== undefined) {
    activeDb
      .prepare(
        "UPDATE sm_propuestas SET estado = ?, programado_el = ?, actualizado_el = datetime('now') WHERE id = ?"
      )
      .run(nuevoEstado, fechaProgramada, id)
  } else if (nuevoEstado === 'publicado') {
    activeDb
      .prepare(
        "UPDATE sm_propuestas SET estado = ?, publicado_el = COALESCE(publicado_el, datetime('now')), actualizado_el = datetime('now') WHERE id = ?"
      )
      .run(nuevoEstado, id)
  } else {
    activeDb
      .prepare(
        "UPDATE sm_propuestas SET estado = ?, actualizado_el = datetime('now') WHERE id = ?"
      )
      .run(nuevoEstado, id)
  }

  const updated = getPropuestaById(id)
  return updated || {
    ...existing,
    estado: nuevoEstado,
    programado_el: fechaProgramada !== undefined ? fechaProgramada : existing.programado_el,
    publicado_el: nuevoEstado === 'publicado' ? (existing.publicado_el || new Date().toISOString()) : existing.publicado_el,
    actualizado_el: new Date().toISOString()
  }
}

export function getPropuestasListasParaPublicar(): SmPropuestaRecord[] {
  const activeDb = db || connectDatabase()
  return activeDb
    .prepare(
      `SELECT id, titulo, contenido, formato, estado, canal_id, hash_unico, programado_el, publicado_el, creado_el, actualizado_el
       FROM sm_propuestas
       WHERE estado = 'programado'
         AND programado_el IS NOT NULL
         AND datetime(programado_el) <= datetime('now')
       ORDER BY programado_el ASC`
    )
    .all() as SmPropuestaRecord[]
}

export function checkTimeoutPropuestas(): SmTimeoutCheckResult {
  const activeDb = db || connectDatabase()

  // Buscar propuestas con fecha programada pasada que no hayan sido aprobadas ni publicadas
  const expired = activeDb
    .prepare(
      `SELECT id FROM sm_propuestas
       WHERE programado_el IS NOT NULL
         AND datetime(programado_el) < datetime('now')
         AND estado NOT IN ('aprobado', 'publicado', 'congelado_por_timeout', 'rechazado')`
    )
    .all() as { id: number }[]

  if (expired.length === 0) {
    return { affectedCount: 0, affectedIds: [] }
  }

  const ids = expired.map((row) => row.id)
  const placeholders = ids.map(() => '?').join(',')
  activeDb
    .prepare(
      `UPDATE sm_propuestas
       SET estado = 'congelado_por_timeout', actualizado_el = datetime('now')
       WHERE id IN (${placeholders})`
    )
    .run(...ids)

  return {
    affectedCount: ids.length,
    affectedIds: ids
  }
}

export function getCanales(): SmCanalRecord[] {
  const activeDb = db || connectDatabase()
  return activeDb
    .prepare('SELECT id, plataforma, activo, cuenta_id, creado_el FROM sm_canales ORDER BY id ASC')
    .all() as SmCanalRecord[]
}

export function getMetricas(propuestaId?: number): SmMetricaRecord[] {
  const activeDb = db || connectDatabase()
  if (propuestaId) {
    return activeDb
      .prepare('SELECT id, propuesta_id, alcance, interacciones, clics, compartidos, registrado_el FROM sm_metricas WHERE propuesta_id = ? ORDER BY id DESC')
      .all(propuestaId) as SmMetricaRecord[]
  }
  return activeDb
    .prepare('SELECT id, propuesta_id, alcance, interacciones, clics, compartidos, registrado_el FROM sm_metricas ORDER BY id DESC')
    .all() as SmMetricaRecord[]
}

// ==========================================
// WhatsApp Engine (MejoraWS): Sesiones, Carpetas y Miembros
// ==========================================

export function getWsSessions(): WsSesionRecord[] {
  const activeDb = db || connectDatabase()
  return activeDb
    .prepare('SELECT id, session_name, status, qr_code, phone, creado_el, actualizado_el FROM ws_sesiones ORDER BY id ASC')
    .all() as WsSesionRecord[]
}

export function getWsSession(sessionName: string = 'default'): WsSesionRecord | null {
  const activeDb = db || connectDatabase()
  const row = activeDb
    .prepare('SELECT id, session_name, status, qr_code, phone, creado_el, actualizado_el FROM ws_sesiones WHERE session_name = ?')
    .get(sessionName) as WsSesionRecord | undefined
  return row || null
}

export function updateWsSession(
  sessionName: string,
  updates: Partial<Pick<WsSesionRecord, 'status' | 'qr_code' | 'phone'>>
): WsSesionRecord {
  const activeDb = db || connectDatabase()
  const existing = getWsSession(sessionName)

  if (!existing) {
    const insert = activeDb.prepare(
      "INSERT INTO ws_sesiones (session_name, status, qr_code, phone, actualizado_el) VALUES (?, ?, ?, ?, datetime('now'))"
    )
    const info = insert.run(
      sessionName,
      updates.status || 'desconectado',
      updates.qr_code ?? null,
      updates.phone ?? null
    )
    return {
      id: Number(info.lastInsertRowid),
      session_name: sessionName,
      status: updates.status || 'desconectado',
      qr_code: updates.qr_code ?? null,
      phone: updates.phone ?? null,
      creado_el: new Date().toISOString(),
      actualizado_el: new Date().toISOString()
    }
  }

  const newStatus = updates.status !== undefined ? updates.status : existing.status
  const newQr = updates.qr_code !== undefined ? updates.qr_code : existing.qr_code
  const newPhone = updates.phone !== undefined ? updates.phone : existing.phone

  activeDb
    .prepare("UPDATE ws_sesiones SET status = ?, qr_code = ?, phone = ?, actualizado_el = datetime('now') WHERE session_name = ?")
    .run(newStatus, newQr, newPhone, sessionName)

  return {
    ...existing,
    status: newStatus,
    qr_code: newQr,
    phone: newPhone,
    actualizado_el: new Date().toISOString()
  }
}

export function getWsCarpetas(): WsCarpetaRecord[] {
  const activeDb = db || connectDatabase()
  return activeDb
    .prepare('SELECT id, nombre, color, creado_el FROM ws_carpetas ORDER BY id ASC')
    .all() as WsCarpetaRecord[]
}

export function getWsCarpetaById(id: number): WsCarpetaRecord | null {
  const activeDb = db || connectDatabase()
  const row = activeDb
    .prepare('SELECT id, nombre, color, creado_el FROM ws_carpetas WHERE id = ?')
    .get(id) as WsCarpetaRecord | undefined
  return row || null
}

export function getWsCarpetaByNombre(nombre: string): WsCarpetaRecord | null {
  const activeDb = db || connectDatabase()
  const row = activeDb
    .prepare('SELECT id, nombre, color, creado_el FROM ws_carpetas WHERE LOWER(nombre) = LOWER(?)')
    .get(nombre) as WsCarpetaRecord | undefined
  return row || null
}

export function createWsCarpeta(carpeta: Partial<WsCarpetaRecord>): WsCarpetaRecord {
  const activeDb = db || connectDatabase()
  const nombre = (carpeta.nombre || 'Nueva Carpeta').trim()
  const color = carpeta.color || '#25D366'
  const stmt = activeDb.prepare(
    'INSERT INTO ws_carpetas (nombre, color) VALUES (?, ?)'
  )
  const info = stmt.run(nombre, color)
  return {
    id: Number(info.lastInsertRowid),
    nombre,
    color,
    creado_el: new Date().toISOString()
  }
}

export function updateWsCarpeta(id: number, updates: Partial<WsCarpetaRecord>): WsCarpetaRecord | null {
  const activeDb = db || connectDatabase()
  const existing = getWsCarpetaById(id)
  if (!existing) return null

  const nombre = updates.nombre ? updates.nombre.trim() : existing.nombre
  const color = updates.color !== undefined ? updates.color : existing.color

  activeDb.prepare('UPDATE ws_carpetas SET nombre = ?, color = ? WHERE id = ?').run(nombre, color, id)
  return {
    ...existing,
    nombre,
    color
  }
}

export function deleteWsCarpeta(id: number): boolean {
  const activeDb = db || connectDatabase()
  const res = activeDb.prepare('DELETE FROM ws_carpetas WHERE id = ?').run(id)
  return res.changes > 0
}

export function getWsMiembros(carpetaId?: number): WsMiembroRecord[] {
  const activeDb = db || connectDatabase()
  if (carpetaId) {
    return activeDb
      .prepare('SELECT id, carpeta_id, persona_id, telefono, agregado_el FROM ws_miembros WHERE carpeta_id = ? ORDER BY id DESC')
      .all(carpetaId) as WsMiembroRecord[]
  }
  return activeDb
    .prepare('SELECT id, carpeta_id, persona_id, telefono, agregado_el FROM ws_miembros ORDER BY id DESC')
    .all() as WsMiembroRecord[]
}

export function findWsMiembroByTelefono(carpetaId: number, telefono: string): WsMiembroRecord | null {
  const activeDb = db || connectDatabase()
  const row = activeDb
    .prepare('SELECT id, carpeta_id, persona_id, telefono, agregado_el FROM ws_miembros WHERE carpeta_id = ? AND telefono = ?')
    .get(carpetaId, telefono) as WsMiembroRecord | undefined
  return row || null
}

export function createWsMiembro(miembro: Partial<WsMiembroRecord>): WsMiembroRecord {
  const activeDb = db || connectDatabase()
  const stmt = activeDb.prepare(
    'INSERT INTO ws_miembros (carpeta_id, persona_id, telefono) VALUES (?, ?, ?)'
  )
  const info = stmt.run(
    miembro.carpeta_id || 1,
    miembro.persona_id ?? null,
    miembro.telefono || ''
  )
  return {
    id: Number(info.lastInsertRowid),
    carpeta_id: miembro.carpeta_id || 1,
    persona_id: miembro.persona_id ?? null,
    telefono: miembro.telefono || '',
    agregado_el: new Date().toISOString()
  }
}

export function deleteWsMiembro(id: number): boolean {
  const activeDb = db || connectDatabase()
  const res = activeDb.prepare('DELETE FROM ws_miembros WHERE id = ?').run(id)
  return res.changes > 0
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

  try {
    const personaTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Persona'").get()
    if (personaTable) {
      const personaCount = (db.prepare('SELECT COUNT(*) as c FROM Persona').get() as { c: number }).c
      if (personaCount === 0) {
        const insertPersona = db.prepare(
          'INSERT INTO Persona (uuid, nombre, apellido, empresa, cargo, scoring, estado_calidad, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        insertPersona.run('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Martín', 'Gómez', 'Logística Santa Fe', 'Gerente de Operaciones', 85, 'util', 'Contacto calificado de prueba')
        insertPersona.run('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Lucía', 'Fernández', 'Estudio Jurídico LF', 'Titular', 92, 'util', 'Lead inbound interesado en consultoría')
      }
    }
  } catch {}

  try {
    const dealTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Deal'").get()
    if (dealTable) {
      const dealCount = (db.prepare('SELECT COUNT(*) as c FROM Deal').get() as { c: number }).c
      if (dealCount === 0) {
        const insertDeal = db.prepare(
          'INSERT INTO Deal (titulo, valor, moneda, etapa_id, probabilidad, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        insertDeal.run('Consultoría Transformación Comercial', 450000, 'ARS', 3, 70, 'abierto', 'Propuesta presentada a Estudio Alvear')
        insertDeal.run('Implementación MejoraSuite Hub', 850000, 'ARS', 2, 50, 'abierto', 'Calificación inicial con Distribuidora El Litoral')
      }
    }
  } catch {}

  try {
    const wsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ws_sesiones'").get()
    if (wsTable) {
      const sessCount = (db.prepare('SELECT COUNT(*) as c FROM ws_sesiones').get() as { c: number }).c
      if (sessCount === 0) {
        db.prepare("INSERT INTO ws_sesiones (session_name, status) VALUES ('default', 'desconectado')").run()
      }
    }
    const wsCarpetasTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ws_carpetas'").get()
    if (wsCarpetasTable) {
      const carpetaCount = (db.prepare('SELECT COUNT(*) as c FROM ws_carpetas').get() as { c: number }).c
      if (carpetaCount === 0) {
        db.prepare("INSERT INTO ws_carpetas (nombre, color) VALUES ('General', '#25D366')").run()
      }
    }
  } catch {}
}
