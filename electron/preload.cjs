// CommonJS a propósito (aunque el resto del proyecto es "type": "module") —
// el preload de Electron con contextIsolation corre en un contexto especial
// donde CJS es lo más simple y predecible para exponer contextBridge.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('suite', {
  open: (target, demoMode) => ipcRenderer.invoke('suite:open', target, demoMode),
  checkMejoraWs: () => ipcRenderer.invoke('suite:checkMejoraWs'),
  getTelemetry: () => ipcRenderer.invoke('suite:getTelemetry'),
  onTelemetryUpdate: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('suite:telemetryUpdate', listener)
    return () => ipcRenderer.removeListener('suite:telemetryUpdate', listener)
  },
})
