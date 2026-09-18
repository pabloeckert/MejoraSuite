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
  mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'))

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
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
  startTelemetryPolling()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (telemetryInterval) {
    clearInterval(telemetryInterval)
    telemetryInterval = null
  }
  if (process.platform !== 'darwin') app.quit()
})
