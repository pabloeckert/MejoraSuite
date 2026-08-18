// MejoraSuite — la sede independiente de la fusión (ver
// C:\Github\Negocio\MejoraCRM\mejorasuite\ESPECIFICACION.md). No fusiona
// código de ninguno de los tres productos: solo los abre/lanza. MejoraCRM y
// MejoraContactos se abren en el navegador del sistema (son apps web reales,
// no tiene sentido cramearlas en una ventana chica de lanzador). MejoraWS es
// una app de escritorio aparte — se lanza vía el protocolo mejoraws:// que
// ya expone ese repo (ver MejoraWS/electron/main.mjs), nunca se reimplementa
// nada de Baileys/WhatsApp acá.

import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

const URLS = {
  crm: 'https://crm.mejoraok.com',
  contactos: 'https://pabloeckert.github.io/MejoraContactos/',
}

const MEJORAWS_PROTOCOL_URL = 'mejoraws://open'
const MEJORAWS_BRIDGE_URL = 'http://127.0.0.1:4180/status'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 620,
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
}

function registerIpcHandlers() {
  ipcMain.handle('suite:open', (_e, target) => {
    if (target === 'ws') {
      shell.openExternal(MEJORAWS_PROTOCOL_URL)
      return true
    }
    const url = URLS[target]
    if (!url) return false
    shell.openExternal(url)
    return true
  })

  // Solo mide si el bridge de MejoraWS responde algo (aunque sea 401 por
  // falta de token) -- no necesita el token para esto, esta app no tiene
  // por qué guardarlo. Un 401 significa "está corriendo"; sin respuesta
  // significa "no está corriendo".
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
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
