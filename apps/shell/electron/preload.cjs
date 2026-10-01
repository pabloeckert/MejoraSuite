const { contextBridge, ipcRenderer } = require('electron')

const waApi = {
  getStatus: () => ipcRenderer.invoke('suite:wa:getStatus'),
  connect: () => ipcRenderer.invoke('suite:wa:connect'),
  logout: () => ipcRenderer.invoke('suite:wa:logout'),
  getCarpetas: () => ipcRenderer.invoke('suite:wa:getCarpetas'),
  createCarpeta: (carpeta) => ipcRenderer.invoke('suite:wa:createCarpeta', carpeta),
  getMiembros: (carpetaId) => ipcRenderer.invoke('suite:wa:getMiembros', carpetaId),
  createMiembro: (miembro) => ipcRenderer.invoke('suite:wa:createMiembro', miembro),
}

contextBridge.exposeInMainWorld('suite', {
  open: (target, demoMode) => ipcRenderer.invoke('suite:open', target, demoMode),
  checkMejoraWs: () => ipcRenderer.invoke('suite:checkMejoraWs'),
  getTelemetry: () => ipcRenderer.invoke('suite:getTelemetry'),
  getDbStatus: () => ipcRenderer.invoke('suite:getDbStatus'),
  pingDb: () => ipcRenderer.invoke('suite:pingDb'),
  wa: waApi,
  db: {
    getStatus: () => ipcRenderer.invoke('suite:getDbStatus'),
    getClientes: () => ipcRenderer.invoke('suite:db:getClientes'),
    createCliente: (cliente) => ipcRenderer.invoke('suite:db:createCliente', cliente),
    getNegocios: () => ipcRenderer.invoke('suite:db:getNegocios'),
    query: (sql, params) => ipcRenderer.invoke('suite:db:query', sql, params),
    crm: {
      getDeals: () => ipcRenderer.invoke('suite:crm:getDeals'),
      createDeal: (deal) => ipcRenderer.invoke('suite:crm:createDeal', deal),
      getPipelines: () => ipcRenderer.invoke('suite:crm:getPipelines'),
      getEtapas: (pipelineId) => ipcRenderer.invoke('suite:crm:getEtapas', pipelineId),
      getClientes: () => ipcRenderer.invoke('suite:db:getClientes'),
      createCliente: (cliente) => ipcRenderer.invoke('suite:db:createCliente', cliente),
    },
    contactos: {
      getPersonas: () => ipcRenderer.invoke('suite:contactos:getPersonas'),
      createPersona: (persona) => ipcRenderer.invoke('suite:contactos:createPersona', persona),
      getClientes: () => ipcRenderer.invoke('suite:db:getClientes'),
      createCliente: (cliente) => ipcRenderer.invoke('suite:db:createCliente', cliente),
    },
    sm: {
      getPropuestas: () => ipcRenderer.invoke('suite:sm:getPropuestas'),
      createPropuesta: (propuesta) => ipcRenderer.invoke('suite:sm:createPropuesta', propuesta),
      getCanales: () => ipcRenderer.invoke('suite:sm:getCanales'),
      getMetricas: (propuestaId) => ipcRenderer.invoke('suite:sm:getMetricas', propuestaId),
    },
    wa: {
      getStatus: () => ipcRenderer.invoke('suite:wa:getStatus'),
      connect: () => ipcRenderer.invoke('suite:wa:connect'),
      logout: () => ipcRenderer.invoke('suite:wa:logout'),
      getCarpetas: () => ipcRenderer.invoke('suite:wa:getCarpetas'),
      createCarpeta: (carpeta) => ipcRenderer.invoke('suite:wa:createCarpeta', carpeta),
      getMiembros: (carpetaId) => ipcRenderer.invoke('suite:wa:getMiembros', carpetaId),
      createMiembro: (miembro) => ipcRenderer.invoke('suite:wa:createMiembro', miembro),
    },
  },
  onTelemetryUpdate: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('suite:telemetryUpdate', listener)
    return () => ipcRenderer.removeListener('suite:telemetryUpdate', listener)
  },
})