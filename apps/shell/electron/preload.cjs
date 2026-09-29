const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('suite', {
  open: (target, demoMode) => ipcRenderer.invoke('suite:open', target, demoMode),
  checkMejoraWs: () => ipcRenderer.invoke('suite:checkMejoraWs'),
  getTelemetry: () => ipcRenderer.invoke('suite:getTelemetry'),
  getDbStatus: () => ipcRenderer.invoke('suite:getDbStatus'),
  pingDb: () => ipcRenderer.invoke('suite:pingDb'),
  db: {
    getStatus: () => ipcRenderer.invoke('suite:getDbStatus'),
    getClientes: () => ipcRenderer.invoke('suite:db:getClientes'),
    createCliente: (cliente) => ipcRenderer.invoke('suite:db:createCliente', cliente),
    getNegocios: () => ipcRenderer.invoke('suite:db:getNegocios'),
    query: (sql, params) => ipcRenderer.invoke('suite:db:query', sql, params),
  },
  onTelemetryUpdate: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('suite:telemetryUpdate', listener)
    return () => ipcRenderer.removeListener('suite:telemetryUpdate', listener)
  },
})