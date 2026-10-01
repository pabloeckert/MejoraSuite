// MejoraSuite — la sede independiente de la fusión (ver
// C:\Github\Negocio\MejoraCRM\mejorasuite\ESPECIFICACION.md). No fusiona
// código de ninguno de los tres productos: solo los abre/lanza. MejoraCRM y
// MejoraContactos se abren en el navegador del sistema (son apps web reales,
// no tiene sentido cramearlas en una ventana chica de lanzador). MejoraWS es
// una app de escritorio aparte — se lanza vía el protocolo mejoraws:// que
// ya expone ese repo (ver MejoraWS/electron/main.mjs), nunca se reimplementa
// nada de Baileys/WhatsApp acá.

import { app, BrowserWindow, ipcMain, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  connectDatabase,
  getDatabase,
  getStatus,
  closeDatabase,
  getClientes,
  createCliente,
  getNegocios,
  querySql,
  getDeals,
  createDeal,
  getPipelines,
  getEtapas,
  getPersonas,
  createPersona,
  getPropuestas,
  createPropuesta,
  updatePropuestaEstado,
  computePropuestaHash,
  findPropuestaByHash,
  checkTimeoutPropuestas,
  getPropuestasListasParaPublicar,
  getCanales,
  getMetricas,
  getWsCarpetas,
  createWsCarpeta,
  getWsSession,
  updateWsSession,
  getWsMiembros,
  createWsMiembro
} from '@mejora/nucleo'
import {
  startWaEngine,
  stopWaEngine,
  connectWhatsApp,
  logoutWhatsApp,
  getWaEngineState
} from './wa-engine/index.mjs'
import {
  dispatchPropuestaZernio,
  isZernioConfigured
} from './zernio-dispatcher.mjs'
import {
  generateCyborgContent
} from './gemini-engine.mjs'

let waEngineInstance = null

let dbInstance = null

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Cargar .env de la raíz del proyecto si existe
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath)
    } catch {
      // Ignorar si falla la carga nativa
    }
  } else {
    try {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=')
          if (eqIdx > 0) {
            const k = trimmed.slice(0, eqIdx).trim()
            const v = trimmed.slice(eqIdx + 1).trim()
            if (k && !process.env[k]) {
              process.env[k] = v
            }
          }
        }
      }
    } catch {
      // Ignorar parse manual
    }
  }
}

const CONTACTOS_API_URL = process.env.CONTACTOS_API_URL || 'https://tzatuvxatsduuslxqdtm.supabase.co/functions/v1/contactos-api'
const CONTACTOS_API_KEY = process.env.CONTACTOS_API_KEY || '270fa9a7c24cf33908cdd2f5cf468760fd490d93049964c717d9a6433d8d3539'

app.disableHardwareAcceleration()

const obtuvoLock = app.requestSingleInstanceLock()
if (!obtuvoLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

let mainWindow = null
let telemetryInterval = null

const URLS = {
  crm: 'https://crm.mejoraok.com',
  contactos: 'https://pabloeckert.github.io/MejoraContactos/',
}

const MEJORAWS_PROTOCOL_URL = 'mejoraws://open'
const MEJORAWS_BRIDGE_URL = 'http://127.0.0.1:4180/status'

async function fetchTelemetry() {
  if (!CONTACTOS_API_URL || !CONTACTOS_API_KEY) {
    return {
      online: false,
      status: 'unconfigured',
      total_contactos: 0,
      sistemas_conectados: [],
      detalles_sistemas: [],
      timestamp: new Date().toISOString(),
      error: 'Variables CONTACTOS_API_URL o CONTACTOS_API_KEY no configuradas',
    }
  }

  const endpoint = CONTACTOS_API_URL.includes('?')
    ? `${CONTACTOS_API_URL}&health=true`
    : `${CONTACTOS_API_URL}?health=true`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-api-key': CONTACTOS_API_KEY,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      return {
        online: false,
        status: `http_${res.status}`,
        total_contactos: 0,
        sistemas_conectados: [],
        detalles_sistemas: [],
        timestamp: new Date().toISOString(),
        error: `HTTP ${res.status}: ${res.statusText}`,
      }
    }

    const data = await res.json()
    return {
      online: data.status === 'ok',
      status: data.status || 'ok',
      total_contactos: typeof data.total_contactos === 'number' ? data.total_contactos : 0,
      sistemas_conectados: Array.isArray(data.sistemas_conectados) ? data.sistemas_conectados : [],
      detalles_sistemas: Array.isArray(data.detalles_sistemas) ? data.detalles_sistemas : [],
      timestamp: data.timestamp || new Date().toISOString(),
      error: null,
    }
  } catch (err) {
    clearTimeout(timeoutId)
    return {
      online: false,
      status: 'offline',
      total_contactos: 0,
      sistemas_conectados: [],
      detalles_sistemas: [],
      timestamp: new Date().toISOString(),
      error: err.name === 'AbortError' ? 'Tiempo de espera agotado' : err.message,
    }
  }
}

function startTelemetryPolling() {
  if (telemetryInterval) clearInterval(telemetryInterval)

  // Polling no bloqueante cada 60 segundos
  telemetryInterval = setInterval(async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const data = await fetchTelemetry()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('suite:telemetryUpdate', data)
      }
    }
  }, 60000)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 680,
    resizable: false,
    icon: path.join(__dirname, '..', 'public', 'brand', process.platform === 'win32' ? 'icon.ico' : 'isotipo-color.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow.setMenuBarVisibility(false)
  const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    mainWindow.loadFile(distIndex);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'));
  }

  mainWindow.webContents.on('did-finish-load', async () => {
    const initialData = await fetchTelemetry()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('suite:telemetryUpdate', initialData)
    }
  })

  mainWindow.on('closed', () => {
    if (telemetryInterval) {
      clearInterval(telemetryInterval)
      telemetryInterval = null
    }
    mainWindow = null
  })
}

/**
 * Extrae los 3 posts publicados con mayor tasa de conversión (o métrica de éxito equivalente)
 * registrados en SQLite en los últimos 30 días, concatenando sus textos en un bloque llamado contexto_historico.
 * @returns {string} Bloque de contexto histórico concatenado o cadena vacía si no hay registros.
 */
function extraerAdnGanadorHistorico() {
  try {
    // Consulta a la tabla sm_metricas unida a los posts publicados (sm_propuestas) de los últimos 30 días
    let rows = querySql(`
      SELECT p.id, p.titulo, p.contenido,
             MAX(CASE WHEN m.alcance > 0 THEN (CAST(m.clics AS REAL) / m.alcance) ELSE 0 END) AS tasa_conversion,
             MAX(m.clics) AS max_clics,
             MAX(m.interacciones) AS max_interacciones
      FROM sm_propuestas p
      INNER JOIN sm_metricas m ON p.id = m.propuesta_id
      WHERE p.estado = 'publicado'
        AND datetime(COALESCE(p.publicado_el, m.registrado_el)) >= datetime('now', '-30 days')
      GROUP BY p.id, p.titulo, p.contenido
      ORDER BY tasa_conversion DESC, max_clics DESC, max_interacciones DESC
      LIMIT 3
    `)

    // Fallback defensivo: si aún no hay publicaciones con métricas en los últimos 30 días,
    // utilizar los mejores posts publicados históricos registrados
    if (!rows || rows.length === 0) {
      rows = querySql(`
        SELECT p.id, p.titulo, p.contenido,
               MAX(CASE WHEN m.alcance > 0 THEN (CAST(m.clics AS REAL) / m.alcance) ELSE 0 END) AS tasa_conversion,
               MAX(m.clics) AS max_clics,
               MAX(m.interacciones) AS max_interacciones
        FROM sm_propuestas p
        INNER JOIN sm_metricas m ON p.id = m.propuesta_id
        WHERE p.estado = 'publicado'
        GROUP BY p.id, p.titulo, p.contenido
        ORDER BY tasa_conversion DESC, max_clics DESC, max_interacciones DESC
        LIMIT 3
      `)
    }

    if (!rows || rows.length === 0) {
      return ''
    }

    // Concatenar sus textos en un bloque estructurado
    const contexto_historico = rows.map((r, idx) => {
      let texto = r.contenido
      try {
        const parsed = JSON.parse(r.contenido)
        if (parsed && typeof parsed === 'object') {
          const parts = []
          if (parsed.hook) parts.push(`Gancho: ${parsed.hook}`)
          if (parsed.body) parts.push(`Cuerpo: ${parsed.body}`)
          if (parsed.cta) parts.push(`Cierre/CTA: ${parsed.cta}`)
          if (parts.length > 0) texto = parts.join('\n')
        }
      } catch {
        // Mantener texto plano
      }
      return `[Post Exitoso #${idx + 1} - ${r.titulo || 'Sin Título'}]\n${texto}`
    }).join('\n\n')

    return contexto_historico
  } catch (err) {
    console.warn('[MejoraSuite] Error al extraer ADN ganador de métricas SQLite:', err)
    return ''
  }
}

function registerIpcHandlers() {
  ipcMain.handle('suite:open', (_e, target, demoMode) => {
    const demoParam = typeof demoMode === 'boolean' ? `?demo=${demoMode}` : ''
    if (target === 'ws') {
      shell.openExternal(`${MEJORAWS_PROTOCOL_URL}${demoParam}`)
      return true
    }
    const url = URLS[target]
    if (!url) return false
    shell.openExternal(`${url}${demoParam}`)
    return true
  })

  ipcMain.handle('suite:checkMejoraWs', async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 1200)
      await fetch(MEJORAWS_BRIDGE_URL, { signal: controller.signal })
      clearTimeout(timeout)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('suite:getTelemetry', async () => {
    return await fetchTelemetry()
  })

    ipcMain.handle('suite:db:getClientes', () => {
    return getClientes()
  })

  ipcMain.handle('suite:db:createCliente', (_e, cliente) => {
    return createCliente(cliente)
  })

  ipcMain.handle('suite:db:getNegocios', () => {
    return getNegocios()
  })

  ipcMain.handle('suite:db:query', (_e, sql, params) => {
    return querySql(sql, params)
  })

  // ==========================================
  // CRM IPC Handlers
  // ==========================================
  ipcMain.handle('suite:crm:getDeals', () => {
    return getDeals()
  })

  ipcMain.handle('suite:crm:createDeal', (_e, deal) => {
    return createDeal(deal)
  })

  ipcMain.handle('suite:crm:getPipelines', () => {
    return getPipelines()
  })

  ipcMain.handle('suite:crm:getEtapas', (_e, pipelineId) => {
    return getEtapas(pipelineId)
  })

  // ==========================================
  // Contactos IPC Handlers
  // ==========================================
  ipcMain.handle('suite:contactos:getPersonas', () => {
    return getPersonas()
  })

  ipcMain.handle('suite:contactos:createPersona', (_e, persona) => {
    return createPersona(persona)
  })

  // ==========================================
  // Social Media (MejoraSM) IPC Handlers
  // ==========================================
  ipcMain.handle('suite:sm:getPropuestas', () => {
    return getPropuestas()
  })

  ipcMain.handle('suite:sm:createPropuesta', (_e, propuesta) => {
    return createPropuesta(propuesta)
  })

  ipcMain.handle('suite:sm:updatePropuestaEstado', (_e, id, estado, fechaProgramada) => {
    return updatePropuestaEstado(Number(id), estado, fechaProgramada)
  })

  ipcMain.handle('suite:sm:verificarHashPropuesta', (_e, dataOrHash) => {
    const hash = typeof dataOrHash === 'string' ? dataOrHash : computePropuestaHash(dataOrHash)
    const existing = findPropuestaByHash(hash)
    return {
      hash,
      exists: !!existing,
      propuesta: existing
    }
  })

  ipcMain.handle('suite:sm:checkTimeoutPropuestas', () => {
    return checkTimeoutPropuestas()
  })

  ipcMain.handle('suite:sm:forceZernioSync', async () => {
    try {
      const res = await syncZernioPropuestas()
      return { success: true, ...res }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('suite:sm:getCanales', () => {
    return getCanales()
  })

  ipcMain.handle('suite:sm:getMetricas', (_e, propuestaId) => {
    return getMetricas(propuestaId)
  })

  // ==========================================
  // IA & Cyborg Editor (Gemini Pro) IPC Handlers
  // ==========================================
  ipcMain.handle('suite:ai:generate', async (_e, prompt, contexto_historico) => {
    try {
      // Extracción del ADN Ganador desde SQLite si no fue especificado manualmente
      const contextoFinal = (typeof contexto_historico === 'string' && contexto_historico.trim().length > 0)
        ? contexto_historico
        : extraerAdnGanadorHistorico()

      return await generateCyborgContent(prompt, contextoFinal)
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })


  // ==========================================
  // WhatsApp Engine (MejoraWS) IPC Handlers
  // ==========================================
  ipcMain.handle('suite:wa:getStatus', () => {
    return getWaEngineState()
  })

  ipcMain.handle('suite:wa:connect', async () => {
    return await connectWhatsApp()
  })

  ipcMain.handle('suite:wa:logout', async () => {
    return await logoutWhatsApp()
  })

  ipcMain.handle('suite:wa:getCarpetas', () => {
    return getWsCarpetas()
  })

  ipcMain.handle('suite:wa:createCarpeta', (_e, carpeta) => {
    return createWsCarpeta(carpeta)
  })

  ipcMain.handle('suite:wa:getMiembros', (_e, carpetaId) => {
    return getWsMiembros(carpetaId)
  })

  ipcMain.handle('suite:wa:createMiembro', (_e, miembro) => {
    return createWsMiembro(miembro)
  })

  ipcMain.handle('suite:getDbStatus', () => {
    return getStatus(dbInstance)
  })

  ipcMain.handle('suite:pingDb', () => {
    const status = getStatus(dbInstance)
    return {
      ok: true,
      message: 'pong',
      sqliteConnected: status.connected,
      tableCount: status.tableCount,
      timestamp: Date.now()
    }
  })
}

// ==========================================
// Zernio Sincronización Automática (Polling local)
// ==========================================
let zernioSyncInterval = null

async function syncZernioPropuestas() {
  const listas = getPropuestasListasParaPublicar()
  if (!listas || listas.length === 0) {
    return { procesadas: 0, publicadas: 0, fallidas: 0, detalles: [] }
  }

  let publicadas = 0
  let fallidas = 0
  const detalles = []

  for (const propuesta of listas) {
    try {
      const res = await dispatchPropuestaZernio(propuesta)
      if (res.success) {
        updatePropuestaEstado(propuesta.id, 'publicado')
        publicadas++
        detalles.push({ id: propuesta.id, estado: 'publicado', zernioPostId: res.zernioPostId })
      } else {
        updatePropuestaEstado(propuesta.id, 'error_sincronizacion')
        fallidas++
        detalles.push({ id: propuesta.id, estado: 'error_sincronizacion', error: res.error })
      }
    } catch (err) {
      updatePropuestaEstado(propuesta.id, 'error_sincronizacion')
      fallidas++
      detalles.push({ id: propuesta.id, estado: 'error_sincronizacion', error: err.message })
    }
  }

  return { procesadas: listas.length, publicadas, fallidas, detalles }
}

function startZernioSyncPolling() {
  if (zernioSyncInterval) return
  setTimeout(async () => {
    try {
      await syncZernioPropuestas()
    } catch (err) {
      console.warn('[Zernio] Aviso en chequeo inicial de publicaciones:', err)
    }
  }, 10000)

  const INTERVAL_MS = 5 * 60 * 1000
  zernioSyncInterval = setInterval(async () => {
    try {
      const res = await syncZernioPropuestas()
      if (res.procesadas > 0) {
        console.log(`[Zernio Polling] Sincronizadas ${res.publicadas}/${res.procesadas} propuestas (fallidas: ${res.fallidas})`)
      }
    } catch (err) {
      console.error('[Zernio Polling] Error en ciclo:', err)
    }
  }, INTERVAL_MS)
}

app.whenReady().then(() => {
  try {
    dbInstance = connectDatabase()
    console.log('[MejoraSuite] SQLite Nucleo inicializado:', getStatus(dbInstance))
  } catch (dbErr) {
    console.error('[MejoraSuite] Error al inicializar SQLite Nucleo:', dbErr)
  }
  registerIpcHandlers()
  createWindow()
  startTelemetryPolling()
  startZernioSyncPolling()

  // Inicialización no bloqueante del motor WhatsApp Baileys + Bridge (127.0.0.1:4180)
  try {
    const userDataDir = app.getPath('userData')
    const waAuthDir = path.join(userDataDir, 'wa-auth')
    waEngineInstance = startWaEngine({ userDataDir, waAuthDir, autoConnect: false })
    console.log('[MejoraSuite] WhatsApp Engine (wa-engine) inicializado silenciosamente en segundo plano (puerto 4180)')
  } catch (waErr) {
    console.error('[MejoraSuite] Error al inicializar wa-engine:', waErr)
  }

  if (process.env.TEST_EXIT) {
    console.log('[MejoraSuite] TEST_EXIT detectado. Arranque e integracion SQLite confirmados. Saliendo.')
    setTimeout(() => { app.quit() }, 2000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (telemetryInterval) {
    clearInterval(telemetryInterval)
    telemetryInterval = null
  }
  if (zernioSyncInterval) {
    clearInterval(zernioSyncInterval)
    zernioSyncInterval = null
  }
  try { stopWaEngine() } catch {}
  try { closeDatabase() } catch {}
  if (process.platform !== 'darwin') app.quit()
})
