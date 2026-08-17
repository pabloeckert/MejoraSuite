// CommonJS a propósito (aunque el resto del proyecto es "type": "module") —
// el preload de Electron con contextIsolation corre en un contexto especial
// donde CJS es lo más simple y predecible para exponer contextBridge.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('suite', {
  open: (target) => ipcRenderer.invoke('suite:open', target),
  checkMejoraWs: () => ipcRenderer.invoke('suite:checkMejoraWs'),
})
