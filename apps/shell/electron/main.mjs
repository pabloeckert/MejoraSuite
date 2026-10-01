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

  ipcMain.handle('suite:sm:getCanales', () => {
    return getCanales()
  })

  ipcMain.handle('suite:sm:getMetricas', (_e, propuestaId) => {
    return getMetricas(propuestaId)
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
  try { stopWaEngine() } catch {}
  try { closeDatabase() } catch {}
  if (process.platform !== 'darwin') app.quit()
})
