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
  Layers,
  Send,
  User,
  Users,
  Sparkles,
  Copy,
  Clock,
  Check
} from 'lucide-react';
import type { WsStatusResponse, WsCarpeta, WsMiembro } from '../../types';

interface ContactoItem {
  id: number | string;
  nombre: string;
  telefono?: string;
}

interface MensajeLog {
  id: string;
  telefono: string;
  nombre?: string;
  mensaje: string;
  hora: string;
  status: 'enviado' | 'error';
  error?: string;
}

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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal para nueva carpeta
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#25D366');

  // Compositor de Outreach Directo
  const [destinatarioTel, setDestinatarioTel] = useState('');
  const [destinatarioNombre, setDestinatarioNombre] = useState('');
  const [mensajeTexto, setMensajeTexto] = useState('');
  const [carpetaEnvioId, setCarpetaEnvioId] = useState<number | ''>('');
  const [isSending, setIsSending] = useState(false);
  const [contactosDb, setContactosDb] = useState<ContactoItem[]>([]);
  const [filtroContactos, setFiltroContactos] = useState('');
  const [mostrarSelectorContactos, setMostrarSelectorContactos] = useState(false);
  const [historialEnvios, setHistorialEnvios] = useState<MensajeLog[]>([]);

  // Plantillas estratégicas del embudo de Mejora Continua (B2B)
  const plantillasEstrategicas = [
    {
      titulo: 'Diagnóstico 4D (Lead Magnet)',
      badge: 'Captura',
      texto: 'Hola {nombre}, estuve revisando cómo estructuran sus operaciones. Te comparto el acceso al Diagnóstico de 4 Dimensiones de Mejora Continua para detectar con precisión quirúrgica dónde se traba hoy el flujo de tu empresa: https://diagnostico.mejoraok.com'
    },
    {
      titulo: 'Inflación Operativa (Empresarios)',
      badge: 'Calidez con Verdad',
      texto: 'Hola {nombre}, cuando el volumen de ventas sube pero la tranquilidad baja, no es un tema de demanda: es inflación operativa. Si tu estructura hoy es un cuello de botella que te impide dirigir, avisame y revisamos juntos dónde destrabar esto sin tocar a tu equipo.'
    },
    {
      titulo: 'Arquitectura Comercial & Trazabilidad',
      badge: 'Ventas B2B',
      texto: 'Hola {nombre}, muchas empresas pierden conversión no por falta de leads, sino porque WhatsApp, CRM y entrega no se hablan. Escribime y te muestro cómo ordenamos los engranajes en las empresas que acompañamos.'
    },
    {
      titulo: 'Líder en Soledad (Validación)',
      badge: 'Alta Dirección',
      texto: 'Hola {nombre}, no tenés por qué seguir decidiendo en soledad ni esperando al colapso para ordenar tu operación. Si querés una perspectiva externa honesta sobre tus números y procesos, ya sabés dónde encontrarme.'
    }
  ];

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

  // Cargar contactos disponibles de SQLite (Personas / Clientes)
  const fetchContactosDisponibles = useCallback(async () => {
    try {
      const db = window.suite?.db;
      if (!db) return;

      const personasPromise = db.contactos?.getPersonas ? db.contactos.getPersonas() : Promise.resolve([]);
      const clientesPromise = db.crm?.getClientes ? db.crm.getClientes() : Promise.resolve([]);

      const [personas, clientes] = await Promise.all([personasPromise, clientesPromise]);
      const mapa = new Map<string, ContactoItem>();

      if (Array.isArray(personas)) {
        personas.forEach((p: any) => {
          if (p.nombre) {
            mapa.set(`p_${p.id}`, { id: p.id, nombre: p.nombre, telefono: p.telefono || '' });
          }
        });
      }

      if (Array.isArray(clientes)) {
        clientes.forEach((c: any) => {
          if (c.nombre) {
            mapa.set(`c_${c.id}`, { id: c.id, nombre: c.nombre, telefono: c.telefono || '' });
          }
        });
      }

      setContactosDb(Array.from(mapa.values()));
    } catch (err: any) {
      console.warn('[WaDashboard] Error cargando contactos de SQLite:', err.message);
    }
  }, []);

  // Polling ligero cada 3 segundos
  useEffect(() => {
    fetchStatusAndCarpetas();
    fetchContactosDisponibles();
    const interval = setInterval(fetchStatusAndCarpetas, 3000);
    return () => clearInterval(interval);
  }, [fetchStatusAndCarpetas, fetchContactosDisponibles]);

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

  // Reconexión manual
  const handleConnect = async () => {
    setLoadingAction('connect');
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const waApi = window.suite?.wa || window.suite?.db?.wa;
      if (waApi) {
        const res = await waApi.connect();
        if (!res.ok && res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Iniciando socket Baileys...');
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
    setSuccessMsg(null);
    try {
      const waApi = window.suite?.wa || window.suite?.db?.wa;
      if (waApi) {
        await waApi.logout();
      }
      await fetchStatusAndCarpetas();
      setSuccessMsg('Sesión desvinculada limpiamente.');
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
        setSuccessMsg(`Carpeta "${newFolderName.trim()}" creada en SQLite.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear carpeta');
    } finally {
      setLoadingAction(null);
    }
  };

  // Aplicar plantilla al compositor
  const handleApplyTemplate = (plantillaTexto: string) => {
    const nombreFinal = destinatarioNombre.trim() || 'Líder';
    const textoPersonalizado = plantillaTexto.replace('{nombre}', nombreFinal);
    setMensajeTexto(textoPersonalizado);
  };

  // Seleccionar contacto de SQLite
  const handleSelectContacto = (c: ContactoItem) => {
    setDestinatarioNombre(c.nombre);
    if (c.telefono) {
      setDestinatarioTel(c.telefono);
    }
    setMostrarSelectorContactos(false);
  };

  // Enviar mensaje de WhatsApp
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinatarioTel.trim()) {
      setErrorMsg('Ingresá un número de teléfono de destino válido.');
      return;
    }
    if (!mensajeTexto.trim()) {
      setErrorMsg('Ingresá el texto del mensaje a enviar.');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const waApi = window.suite?.wa || window.suite?.db?.wa;
    if (!waApi) {
      setErrorMsg('API de WhatsApp no disponible en este entorno.');
      setIsSending(false);
      return;
    }

    try {
      let res: any;
      if (waApi.sendMessage && carpetaEnvioId !== '') {
        res = await waApi.sendMessage(destinatarioTel.trim(), mensajeTexto.trim(), Number(carpetaEnvioId));
      } else if (waApi.sendDirectMessage) {
        res = await waApi.sendDirectMessage(destinatarioTel.trim(), mensajeTexto.trim(), destinatarioNombre.trim() || undefined);
      } else {
        res = { error: 'Método de envío no implementado en el puente.' };
      }

      const horaActual = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      if (res?.error) {
        setErrorMsg(res.error);
        setHistorialEnvios(prev => [
          {
            id: String(Date.now()),
            telefono: destinatarioTel.trim(),
            nombre: destinatarioNombre.trim() || undefined,
            mensaje: mensajeTexto.trim(),
            hora: horaActual,
            status: 'error',
            error: res.error
          },
          ...prev
        ]);
      } else {
        setSuccessMsg(`Mensaje enviado con éxito a +${destinatarioTel.trim()} (ID: ${res?.msgId || 'OK'}).`);
        setHistorialEnvios(prev => [
          {
            id: res?.msgId || String(Date.now()),
            telefono: destinatarioTel.trim(),
            nombre: destinatarioNombre.trim() || undefined,
            mensaje: mensajeTexto.trim(),
            hora: horaActual,
            status: 'enviado'
          },
          ...prev
        ]);
        setMensajeTexto('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falla de comunicación al despachar mensaje.');
    } finally {
      setIsSending(false);
    }
  };

  const isConnected = status.connected || status.waStatus === 'conectado';
  const isConnecting = status.waStatus === 'conectando' || status.waStatus === 'reconectando';

  const contactosFiltrados = contactosDb.filter(c => 
    c.nombre.toLowerCase().includes(filtroContactos.toLowerCase()) || 
    (c.telefono && c.telefono.includes(filtroContactos))
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Encabezado Institucional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm">
              <MessageCircle className="h-5 w-5" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A3D84]">
              MejoraWS · Centro de Outreach
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Baileys v7 · SQLite Soberano</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 max-w-3xl">
            Motor autónomo de mensajería ejecutiva directa. Conectado a la base local de contactos y alineado con el Criterio Medular de Mejora Continua®.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStatusAndCarpetas}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            title="Sincronizar estado"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#1A3D84]" />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Alertas de Notificación */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {/* Grilla Principal de Tres Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* COLUMNA 1: ESTADO Y CONEXIÓN BAILYS (4 Columnas) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#1A3D84]" />
                <h2 className="text-base font-bold text-slate-900">Estado del Socket</h2>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-amber-50 text-amber-700 border border-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="capitalize">{status.waStatus}</span>
              </span>
            </div>

            {/* Contenido según conexión */}
            <div className="flex flex-col items-center justify-center py-4 min-h-[220px]">
              {isConnected ? (
                <div className="text-center w-full space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">WhatsApp Vinculado</h3>
                    {status.phone && (
                      <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono font-semibold">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+{status.phone}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Listo para enviar mensajes directos de trinchera y sincronizar con SQLite.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleLogout}
                      disabled={loadingAction === 'logout'}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{loadingAction === 'logout' ? 'Desvinculando...' : 'Desvincular WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              ) : isConnecting ? (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">Conectando socket Baileys...</p>
                  <p className="text-xs text-slate-400">Verificando claves locales en wa-auth</p>
                </div>
              ) : status.qr ? (
                <div className="text-center space-y-3 w-full animate-fadeIn">
                  <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200 inline-block">
                    <img src={status.qr} alt="QR WhatsApp" className="w-48 h-48 object-contain rounded" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
                    <QrCode className="w-3.5 h-3.5 text-amber-600" />
                    <span>Escaneá con tu celular</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    WhatsApp &gt; Dispositivos vinculados &gt; Vincular dispositivo
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Sesión en Reposo</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Presioná conectar para levantar el socket o generar el código QR.
                    </p>
                  </div>
                  <button
                    onClick={handleConnect}
                    disabled={loadingAction === 'connect'}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'connect' ? 'animate-spin' : ''}`} />
                    <span>{loadingAction === 'connect' ? 'Iniciando...' : 'Conectar WhatsApp'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Almacenamiento local</span>
              <span className="font-mono text-slate-600">SQLite + wa-auth</span>
            </div>
          </div>

          {/* Carpetas y Audiencias en SQLite */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-[#1A3D84]" />
                <h3 className="text-sm font-bold text-slate-900">Carpetas SQLite</h3>
              </div>
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Nueva</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {carpetas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No hay carpetas creadas en SQLite.</p>
              ) : (
                carpetas.map(c => {
                  const isSelected = selectedCarpetaId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCarpetaId(isSelected ? null : c.id)}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? 'bg-blue-50 border-[#1A3D84] text-[#1A3D84] font-semibold' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color || '#25D366' }} />
                        <span className="truncate">{c.nombre}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ID #{c.id}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Miembros de la carpeta activa */}
            {selectedCarpetaId && (
              <div className="pt-3 border-t border-slate-100 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#1A3D84]" />
                    Miembros ({miembros.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ws_miembros</span>
                </div>
                {miembros.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Carpeta vacía.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {miembros.map(m => (
                      <div key={m.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-800 font-medium">+{m.telefono}</span>
                        <button
                          onClick={() => setDestinatarioTel(m.telefono)}
                          className="text-[10px] text-[#1A3D84] hover:underline font-semibold cursor-pointer"
                        >
                          Cargar Tel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 2: COMPOSITOR DE OUTREACH DIRECTO (8 Columnas) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#1A3D84]" />
                  <span>Compositor de Outreach Directo</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Envío individualizado con respaldo en SQLite Núcleo sin depender de la nube.
                </p>
              </div>

              {/* Selector de Contacto de SQLite */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMostrarSelectorContactos(!mostrarSelectorContactos)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-[#1A3D84]" />
                  <span>Contactos SQLite ({contactosDb.length})</span>
                </button>

                {mostrarSelectorContactos && (
                  <div className="absolute right-0 top-10 z-30 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 space-y-2 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o teléfono..."
                      value={filtroContactos}
                      onChange={(e) => setFiltroContactos(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#1A3D84]"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {contactosFiltrados.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-2 text-center">No se encontraron contactos</p>
                      ) : (
                        contactosFiltrados.slice(0, 15).map(c => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectContacto(c)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-xs cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-medium text-slate-800 truncate">{c.nombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{c.telefono || 'Sin tel'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Formulario de Envío */}
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Número de WhatsApp (con código de país)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 5491122334455"
                    value={destinatarioTel}
                    onChange={(e) => setDestinatarioTel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:border-[#1A3D84] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nombre del Contacto (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Carlos Mendoza"
                    value={destinatarioNombre}
                    onChange={(e) => setDestinatarioNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:border-[#1A3D84]"
                  />
                </div>
              </div>

              {/* Plantillas Estratégicas Rápidas */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F7CC13]" />
                  <span>Plantillas del Embudo Estratégico B2B:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plantillasEstrategicas.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(p.texto)}
                      className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#1A3D84]/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">{p.titulo}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1A3D84]/10 text-[#1A3D84] font-semibold">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {p.texto}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Texto del Mensaje */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Mensaje a Despachar
                  </label>
                  <span className="text-xs text-slate-400 font-mono">
                    {mensajeTexto.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  placeholder="Escribí tu mensaje o seleccioná una plantilla arriba..."
                  value={mensajeTexto}
                  onChange={(e) => setMensajeTexto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:border-[#1A3D84] leading-relaxed resize-y"
                />
              </div>

              {/* Selector de Carpeta en SQLite y Botón de Envío */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Asignar a Carpeta:</span>
                  <select
                    value={carpetaEnvioId}
                    onChange={(e) => setCarpetaEnvioId(e.target.value ? Number(e.target.value) : '')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:border-[#1A3D84]"
                  >
                    <option value="">Carpeta General / Contactos</option>
                    {carpetas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSending || !isConnected || !destinatarioTel.trim() || !mensajeTexto.trim()}
                  className="px-6 py-3 rounded-xl bg-[#1A3D84] hover:bg-[#15326c] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Despachando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Despachar por WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Log de Envíos en Sesión */}
          {historialEnvios.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1A3D84]" />
                  <span>Envíos Realizados en esta Sesión ({historialEnvios.length})</span>
                </h3>
                <span className="text-xs text-slate-400">Trazabilidad activa</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {historialEnvios.map(item => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.nombre || 'Contacto'}</span>
                        <span className="font-mono text-slate-600">+{item.telefono}</span>
                        <span className="text-[10px] text-slate-400">{item.hora}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] line-clamp-1">{item.mensaje}</p>
                    </div>
                    <div>
                      {item.status === 'enviado' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <Check className="w-3 h-3" />
                          <span>Enviado</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Falla</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear Carpeta */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-[#1A3D84] uppercase mb-1">
              Nueva Carpeta de WhatsApp
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Crea una lista en SQLite para organizar los envíos y segmentar tus contactos.
            </p>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Nombre de la Carpeta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Clientes VIP, Seguimiento Diagnóstico, Comercial"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:border-[#1A3D84]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Color Identificador
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-600">{newFolderColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === 'create-folder'}
                  className="px-5 py-2 rounded-xl bg-[#1A3D84] hover:bg-[#15326c] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
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
