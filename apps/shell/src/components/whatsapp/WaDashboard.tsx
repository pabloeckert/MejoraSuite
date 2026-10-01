import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Folder,
  Plus,
  Phone,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import type { WsStatusResponse, WsCarpeta, WsMiembro } from '../../types';

export const WaDashboard: React.FC = () => {
  const [status, setStatus] = useState<WsStatusResponse>({
    connected: false,
    waStatus: 'desconectado',
    phone: null,
    qr: null,
  });
  const [carpetas, setCarpetas] = useState<WsCarpeta[]>([]);
  const [selectedCarpetaId, setSelectedCarpetaId] = useState<number | null>(null);
  const [miembros, setMiembros] = useState<WsMiembro[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#25D366');

  // Consulta el estado de WhatsApp y las carpetas de SQLite
  const fetchStatusAndCarpetas = useCallback(async () => {
    try {
      const waApi = window.suite?.wa || window.suite?.db?.wa;
      if (waApi) {
        const currentStatus = await waApi.getStatus();
        setStatus(currentStatus);

        const currentCarpetas = await waApi.getCarpetas();
        setCarpetas(currentCarpetas || []);
      }
    } catch (err: any) {
      console.warn('[WaDashboard] Error al consultar estado de WhatsApp:', err.message);
    }
  }, []);

  // Polling ligero cada 3 segundos
  useEffect(() => {
    fetchStatusAndCarpetas();
    const interval = setInterval(fetchStatusAndCarpetas, 3000);
    return () => clearInterval(interval);
  }, [fetchStatusAndCarpetas]);

  // Cargar miembros al seleccionar una carpeta
  useEffect(() => {
    if (selectedCarpetaId != null) {
      const waApi = window.suite?.wa || window.suite?.db?.wa;
      if (waApi) {
        waApi.getMiembros(selectedCarpetaId)
          .then((res) => setMiembros(res || []))
          .catch(() => setMiembros([]));
      }
    } else {
      setMiembros([]);
    }
  }, [selectedCarpetaId]);

  // Forzar reconexión manual
  const handleConnect = async () => {
    setLoadingAction('connect');
    setErrorMsg(null);
    try {
      const waApi = window.suite?.wa || window.suite?.db?.wa;
      if (waApi) {
        const res = await waApi.connect();
        if (!res.ok && res.error) {
          setErrorMsg(res.error);
        }
      }
      await fetchStatusAndCarpetas();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con WhatsApp');
    } finally {
      setLoadingAction(null);
    }
  };

  // Desvincular WhatsApp
  const handleLogout = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desvincular la sesión de WhatsApp?')) {
      return;
    }
    setLoadingAction('logout');
    setErrorMsg(null);
    try {
      const waApi = window.suite?.wa || window.suite?.db?.wa;
      if (waApi) {
        await waApi.logout();
      }
      await fetchStatusAndCarpetas();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al desvincular sesión');
    } finally {
      setLoadingAction(null);
    }
  };

  // Crear nueva carpeta en SQLite
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setLoadingAction('create-folder');
    try {
      const waApi = window.suite?.wa || window.suite?.db?.wa;
      if (waApi) {
        await waApi.createCarpeta({
          nombre: newFolderName.trim(),
          color: newFolderColor
        });
        setNewFolderName('');
        setShowNewFolderModal(false);
        const updated = await waApi.getCarpetas();
        setCarpetas(updated || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear carpeta');
    } finally {
      setLoadingAction(null);
    }
  };

  const isConnected = status.connected || status.waStatus === 'conectado';
  const isConnecting = status.waStatus === 'conectando' || status.waStatus === 'reconectando';
  const isScanningQr = status.waStatus === 'escaneando_qr';

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn font-modelica">
      {/* Header del Tablero */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-spartan font-bold uppercase tracking-wider">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>wa-engine · Baileys v7 · SQLite</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
              Puerto 4180
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase font-spartan">
            Panel de Control <span className="text-[#25D366]">WhatsApp</span>
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Motor de mensajería asíncrono y soberano. Vinculación nativa multi-archivo con SQLite Núcleo y persistencia local sin intermediarios en la nube.
          </p>
        </div>

        {/* Botón de sincronización inmediata */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatusAndCarpetas}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-mc-azul-surface/80 border border-white/10 hover:border-mc-amarillo/40 text-slate-200 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            title="Sincronizar estado ahora"
          >
            <RefreshCw className="w-4 h-4 text-mc-amarillo" />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Alerta de error si existe */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs font-bold uppercase text-rose-400 hover:text-rose-200 cursor-pointer ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Cuadrícula de 2 Paneles Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL 1: CONEXIÓN & QR (5 Columnas en Desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            {/* Cabecera del Panel */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-spartan uppercase">
                    Estado de Conexión
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400 pulse-indicator' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
                    }`} />
                    <span className="text-xs font-medium text-slate-300 capitalize">
                      {status.waStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de Reconexión Manual */}
              <button
                onClick={handleConnect}
                disabled={loadingAction === 'connect'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                title="Forzar intento de conexión con Baileys"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'connect' ? 'animate-spin' : ''}`} />
                <span>Reconectar</span>
              </button>
            </div>

            {/* Contenido según el estado */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              {isConnected ? (
                /* ESTADO: CONECTADO */
                <div className="w-full text-center py-4 flex flex-col items-center justify-center animate-fadeIn">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 shadow-card-glow">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-spartan font-bold uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>WhatsApp Conectado</span>
                  </div>

                  <h3 className="text-xl font-bold text-white font-spartan mt-1">
                    Sesión Vinculada
                  </h3>

                  {status.phone ? (
                    <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-mc-azul-surface/70 border border-white/10 text-slate-200">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-sm tracking-wide font-bold">
                        +{status.phone}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">Número detectado por Baileys</p>
                  )}

                  <p className="text-xs text-slate-300 max-w-xs mt-3 leading-relaxed">
                    Las respuestas entrantes y los estados de entrega se almacenan en tiempo real en SQLite Núcleo.
                  </p>

                  <div className="mt-8 w-full pt-4 border-t border-white/10">
                    <button
                      onClick={handleLogout}
                      disabled={loadingAction === 'logout'}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-spartan font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{loadingAction === 'logout' ? 'Desvinculando...' : 'Desvincular WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              ) : isConnecting ? (
                /* ESTADO: CONECTANDO */
                <div className="text-center py-8 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin mb-4" />
                  <p className="text-sm font-semibold text-white">Iniciando Socket de WhatsApp...</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Cargando claves de autenticación desde userData/wa-auth.
                  </p>
                </div>
              ) : status.qr ? (
                /* ESTADO: ESCANEANDO QR (QR Disponible) */
                <div className="text-center flex flex-col items-center animate-fadeIn">
                  <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20 mb-4 inline-block">
                    <img
                      src={status.qr}
                      alt="Código QR de WhatsApp"
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mc-amarillo/10 border border-mc-amarillo/20 text-mc-amarillo text-xs font-spartan font-bold uppercase tracking-wider mb-2">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Escaneá desde tu Celular</span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                    Abrí WhatsApp en tu teléfono &gt; Ajustes &gt; Dispositivos vinculados &gt; Vincular un dispositivo.
                  </p>
                </div>
              ) : (
                /* ESTADO: DESCONECTADO (Sin QR generado aún) */
                <div className="text-center py-8 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-4">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white font-spartan uppercase">
                    Sesión Desconectada
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xs mt-1 mb-6">
                    Presioná el botón a continuación para generar un código QR y vincular tu cuenta de WhatsApp.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={loadingAction === 'connect'}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-mc-slate font-spartan font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAction === 'connect' ? 'animate-spin' : ''}`} />
                    <span>{loadingAction === 'connect' ? 'Iniciando...' : 'Generar Código QR'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Pie de Información del Almacenamiento */}
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Almacenamiento: SQLite + wa-auth</span>
              <span className="font-mono text-slate-300">Sesión: default</span>
            </div>
          </div>
        </div>

        {/* PANEL 2: CARPETAS & MIEMBROS SQLITE (7 Columnas en Desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6">
            {/* Cabecera del Panel de Carpetas */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-spartan uppercase">
                    Carpetas de Campañas (SQLite)
                  </h2>
                  <p className="text-xs text-slate-400">
                    {carpetas.length} {carpetas.length === 1 ? 'carpeta registrada' : 'carpetas registradas'} en tabla <code className="text-teal-300 font-mono">ws_carpetas</code>
                  </p>
                </div>
              </div>

              {/* Botón para crear nueva carpeta */}
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-300 text-xs font-spartan font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Carpeta</span>
              </button>
            </div>

            {/* Listado de Carpetas */}
            {carpetas.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Folder className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                <p className="text-sm font-semibold text-slate-300">No hay carpetas creadas en SQLite</p>
                <p className="text-xs text-slate-400 mt-1">
                  Creá una carpeta para organizar tus contactos de WhatsApp.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {carpetas.map((c) => {
                  const isSelected = selectedCarpetaId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCarpetaId(isSelected ? null : c.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-mc-azul-surface/90 border-mc-amarillo/50 shadow-md'
                          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: c.color || '#25D366' }}
                          />
                          <span className="font-bold text-white text-sm tracking-tight truncate">
                            {c.nombre}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-black/20 px-2 py-0.5 rounded">
                          ID: {c.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/5">
                        <span>Alta: {c.creado_el ? new Date(c.creado_el).toLocaleDateString('es-AR') : '--'}</span>
                        <span className="text-mc-amarillo font-semibold hover:underline">
                          {isSelected ? 'Ocultar miembros' : 'Ver miembros'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detalle de Miembros de la Carpeta Seleccionada */}
            {selectedCarpetaId && (
              <div className="mt-4 pt-4 border-t border-white/10 animate-fadeIn">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-spartan font-bold uppercase tracking-wider text-mc-amarillo flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Miembros en Carpeta #{selectedCarpetaId} ({miembros.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Tabla ws_miembros</span>
                </div>

                {miembros.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Esta carpeta no contiene contactos asociados aún. Los envíos desde MejoraContactos o CRM se asignarán aquí automáticamente.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {miembros.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span className="font-mono text-slate-200 font-bold">{m.telefono}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                          {m.persona_id && (
                            <span className="bg-teal-500/15 text-teal-300 px-2 py-0.5 rounded border border-teal-500/20">
                              Persona #{m.persona_id}
                            </span>
                          )}
                          <span>{m.agregado_el ? new Date(m.agregado_el).toLocaleDateString('es-AR') : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Crear Carpeta */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 shadow-2xl border border-white/20">
            <h3 className="text-lg font-bold text-white font-spartan uppercase mb-2">
              Nueva Carpeta de WhatsApp
            </h3>
            <p className="text-xs text-slate-300 mb-5">
              Crea una lista en SQLite para organizar los envíos y segmentar tus contactos.
            </p>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-spartan font-bold uppercase text-slate-200 mb-1.5">
                  Nombre de la Carpeta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Clientes VIP, Cumpleaños, Comercial"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-mc-amarillo"
                />
              </div>

              <div>
                <label className="block text-xs font-spartan font-bold uppercase text-slate-200 mb-1.5">
                  Color Identificador
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300">{newFolderColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === 'create-folder'}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-spartan font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loadingAction === 'create-folder' ? 'Guardando...' : 'Crear en SQLite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaDashboard;
