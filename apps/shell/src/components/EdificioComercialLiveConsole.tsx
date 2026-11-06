import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  DollarSign,
  Zap,
  RefreshCw,
  Plus,
  Phone,
  Check,
  ArrowRight,
  Trophy,
  XCircle,
  History,
  Target,
  Activity,
  Share2,
  Briefcase,
} from 'lucide-react';

const NUCLEO_BASE_URL = 'http://127.0.0.1:4002';

export interface ProspectoLiveDTO {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  canalOrigen: string;
  estado: 'CAPTURADO' | 'CALIFICADO' | 'EN_SEGUIMIENTO' | 'CERRADO_GANADO' | 'CERRADO_PERDIDO';
  piezaIdAtribucion?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  buyerPersonaId?: string;
  createdAt: string;
  updatedAt: string;
  slaHorasRestantes: number;
  slaEstado: 'VERDE' | 'AMARILLO' | 'ROJO' | 'CUMPLIDO';
}

export interface EventoAuditDTO {
  id: number;
  prospectoId: string;
  evento: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  detalles: string;
  timestamp: string;
}

const CANAL_NAMES: Record<string, string> = {
  diagnostico_4d: 'Diagnóstico 4D (Test)',
  mejoraok_landing: 'Web Institucional (Mejoraok)',
  landing_hostinger: 'Landing Hostinger',
  base_propia_contactos: 'Base Propia (MejoraContactos)',
  social_media_utm: 'Social Media (MejoraSM)',
  crm_manual: 'Alta Manual CRM',
};

const PERSONA_NAMES: Record<string, { label: string; color: string }> = {
  SATURADO: { label: 'El Fundador Saturado', color: 'bg-red-50 text-red-800 border-red-200' },
  AREA_COMERCIAL_SIN_RESULTADOS: {
    label: 'Comercial sin Conversión',
    color: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  SIN_PROFESIONALIZAR_LA_EMPRESA: {
    label: 'Empresa sin Procesos',
    color: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  EQUIPO_DESALINEADO: {
    label: 'Equipo Desalineado',
    color: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  LIDER_QUE_NECESITA_APOYO: {
    label: 'Líder sin Herramientas',
    color: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  INDEPENDIENTE_EN_CRECIMIENTO: {
    label: 'Independiente en Crecimiento',
    color: 'bg-blue-50 text-blue-800 border-blue-200',
  },
};

interface EdificioComercialLiveConsoleProps {
  onNavigateView?: (view: 'crm' | 'sm' | 'contactos' | 'wa') => void;
}

export function EdificioComercialLiveConsole({ onNavigateView }: EdificioComercialLiveConsoleProps) {
  const [prospectos, setProspectos] = useState<ProspectoLiveDTO[]>([]);
  const [nucleoOnline, setNucleoOnline] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ticketPromedioUsd, setTicketPromedioUsd] = useState<number>(1500);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Formulario de nuevo prospecto inline
  const [showNewForm, setShowNewForm] = useState<boolean>(false);
  const [newNombre, setNewNombre] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newTelefono, setNewTelefono] = useState<string>('+5493764');
  const [newCanal, setNewCanal] = useState<string>('diagnostico_4d');
  const [newPieza, setNewPieza] = useState<string>('PROP-2026-W01-03');
  const [newPersona, setNewPersona] = useState<string>('SATURADO');

  // Historial de auditoría SQLite
  const [auditProspecto, setAuditProspecto] = useState<ProspectoLiveDTO | null>(null);
  const [auditEvents, setAuditEvents] = useState<EventoAuditDTO[]>([]);
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);

  const cargarProspectos = useCallback(async () => {
    const t0 = performance.now();
    try {
      const res = await fetch(`${NUCLEO_BASE_URL}/api/prospectos`);
      const elapsed = Math.round(performance.now() - t0);
      if (res.ok) {
        const data = (await res.json()) as ProspectoLiveDTO[];
        setProspectos(Array.isArray(data) ? data : []);
        setNucleoOnline(true);
        setLatencyMs(elapsed);
      } else {
        setNucleoOnline(false);
      }
    } catch {
      setNucleoOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProspectos();
    const timer = setInterval(cargarProspectos, 10000);
    return () => clearInterval(timer);
  }, [cargarProspectos]);

  // Métricas ejecutivas de negocio y conversión financiera
  const kpis = useMemo(() => {
    let slaVerde = 0;
    let slaAmarillo = 0;
    let slaRojo = 0;
    let calificados = 0;
    let enSeguimiento = 0;
    let ganados = 0;
    let perdidos = 0;

    const porPersona: Record<string, { total: number; avanzados: number; ganados: number }> = {};
    const porPieza: Record<string, { total: number; canal: string; persona: string }> = {};

    for (const p of prospectos) {
      if (p.estado === 'CAPTURADO') {
        if (p.slaEstado === 'ROJO') slaRojo++;
        else if (p.slaEstado === 'AMARILLO') slaAmarillo++;
        else slaVerde++;
      } else if (p.estado === 'CALIFICADO') {
        calificados++;
      } else if (p.estado === 'EN_SEGUIMIENTO') {
        enSeguimiento++;
      } else if (p.estado === 'CERRADO_GANADO') {
        ganados++;
      } else if (p.estado === 'CERRADO_PERDIDO') {
        perdidos++;
      }

      const bp = p.buyerPersonaId || 'SIN_CLASIFICAR';
      if (!porPersona[bp]) porPersona[bp] = { total: 0, avanzados: 0, ganados: 0 };
      porPersona[bp].total++;
      if (p.estado === 'CALIFICADO' || p.estado === 'EN_SEGUIMIENTO' || p.estado === 'CERRADO_GANADO') {
        porPersona[bp].avanzados++;
      }
      if (p.estado === 'CERRADO_GANADO') {
        porPersona[bp].ganados++;
      }

      if (p.piezaIdAtribucion) {
        if (!porPieza[p.piezaIdAtribucion]) {
          porPieza[p.piezaIdAtribucion] = {
            total: 0,
            canal: p.utmSource || p.canalOrigen,
            persona: bp,
          };
        }
        porPieza[p.piezaIdAtribucion].total++;
      }
    }

    // Valor ponderado del Pipeline en USD:
    // Capturado = 20%, Calificado = 45%, En Seguimiento = 75%, Cerrado Ganado = 100%
    const ingresosFacturadosUsd = ganados * ticketPromedioUsd;
    const pipelinePonderadoUsd = Math.round(
      (slaVerde + slaAmarillo + slaRojo) * (ticketPromedioUsd * 0.2) +
        calificados * (ticketPromedioUsd * 0.45) +
        enSeguimiento * (ticketPromedioUsd * 0.75) +
        ingresosFacturadosUsd
    );

    const avanzadosTotal = calificados + enSeguimiento + ganados;
    const tasaAvancePct =
      prospectos.length > 0 ? Math.round((avanzadosTotal / prospectos.length) * 100) : 0;

    return {
      total: prospectos.length,
      slaVerde,
      slaAmarillo,
      slaRojo,
      calificados,
      enSeguimiento,
      ganados,
      perdidos,
      avanzadosTotal,
      tasaAvancePct,
      ingresosFacturadosUsd,
      pipelinePonderadoUsd,
      porPersona,
      porPieza,
    };
  }, [prospectos, ticketPromedioUsd]);

  // Acción: Probar y Comprobar el Circuito Completo en 1 clic
  const handleProbarCircuitoEnVivo = async () => {
    setBusyId('test-e2e');
    setFeedbackMsg(null);
    try {
      const muestras = [
        {
          nombre: 'Dir. Martín Echeverría (Agroindustrial Misiones)',
          email: `mecheverria.${Date.now().toString().slice(-4)}@agromisiones.com.ar`,
          telefono: '+5493764667788',
          canalOrigen: 'diagnostico_4d',
          piezaIdAtribucion: 'PROP-2026-W01-03',
          utmSource: 'instagram',
          utmMedium: 'organic_social',
          utmCampaign: 'evergreen_26s',
          buyerPersonaId: 'SATURADO',
        },
        {
          nombre: 'Lic. Valeria Soria (Clínica Privada del Sol)',
          email: `vsoria.${Date.now().toString().slice(-4)}@clinicadelsol.com.ar`,
          telefono: '+5493764223344',
          canalOrigen: 'mejoraok_landing',
          piezaIdAtribucion: 'PROP-2026-W02-01',
          utmSource: 'facebook',
          utmMedium: 'organic_social',
          utmCampaign: 'evergreen_26s',
          buyerPersonaId: 'AREA_COMERCIAL_SIN_RESULTADOS',
        },
      ];
      const muestra = muestras[prospectos.length % muestras.length];

      const res = await fetch(`${NUCLEO_BASE_URL}/api/prospectos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(muestra),
      });

      if (res.ok) {
        const creado = (await res.json()) as ProspectoLiveDTO;
        await cargarProspectos();
        setFeedbackMsg(
          `✓ COMPROBADO EN VIVO: Prospecto "${creado.nombre}" insertado en SQLite (ID: ${creado.id.slice(
            0,
            8
          )}...) con atribución a pieza ${creado.piezaIdAtribucion} y reloj SLA 48h activo.`
        );
      } else {
        setFeedbackMsg('Error al insertar prospecto de prueba en MejoraNucleo.');
      }
    } catch (e) {
      setFeedbackMsg(`Error de red al conectar con MejoraNucleo: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  // Acciones de transición de ciclo de vida en SQLite
  const handleTransicion = async (
    id: string,
    accion: 'calificar' | 'seguimiento' | 'ganado' | 'perdido'
  ) => {
    setBusyId(id);
    setFeedbackMsg(null);
    try {
      let url = `${NUCLEO_BASE_URL}/api/prospectos/${id}/calificar`;
      let body: Record<string, unknown> = {};
      if (accion === 'seguimiento') {
        url = `${NUCLEO_BASE_URL}/api/prospectos/${id}/seguimiento`;
      } else if (accion === 'ganado' || accion === 'perdido') {
        url = `${NUCLEO_BASE_URL}/api/prospectos/${id}/cerrar`;
        body = { ganado: accion === 'ganado' };
      }

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const actualizado = (await res.json()) as ProspectoLiveDTO;
        await cargarProspectos();
        setFeedbackMsg(
          `✓ Estado actualizado en SQLite: "${actualizado.nombre}" avanzó a ${actualizado.estado}.`
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleCrearManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newEmail.trim()) return;
    setBusyId('new-form');
    try {
      const res = await fetch(`${NUCLEO_BASE_URL}/api/prospectos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newNombre.trim(),
          email: newEmail.trim(),
          telefono: newTelefono.trim(),
          canalOrigen: newCanal,
          piezaIdAtribucion: newPieza.trim(),
          utmSource: newCanal.includes('social') ? 'instagram' : 'directo',
          utmMedium: 'organic_social',
          utmCampaign: 'evergreen_26s',
          buyerPersonaId: newPersona,
        }),
      });
      if (res.ok) {
        const creado = (await res.json()) as ProspectoLiveDTO;
        setNewNombre('');
        setNewEmail('');
        setShowNewForm(false);
        await cargarProspectos();
        setFeedbackMsg(`✓ Prospecto "${creado.nombre}" registrado en SQLite con SLA 48h activo.`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleVerAuditoria = async (p: ProspectoLiveDTO) => {
    setAuditProspecto(p);
    setLoadingAudit(true);
    try {
      const res = await fetch(`${NUCLEO_BASE_URL}/api/prospectos/${p.id}/eventos`);
      if (res.ok) {
        const data = (await res.json()) as EventoAuditDTO[];
        setAuditEvents(Array.isArray(data) ? data : []);
      } else {
        setAuditEvents([]);
      }
    } catch {
      setAuditEvents([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  return (
    <section
      aria-label="Tablero Ejecutivo de Negocio y Consola Operativa SLA 48h"
      className="mb-10 rounded-2xl border-2 border-[#1A3D84]/20 bg-white shadow-md overflow-hidden"
    >
      {/* BARRA TRICOLOR INSTITUCIONAL */}
      <div className="h-2 w-full flex">
        <div className="w-[70%] bg-[#1A3D84]" />
        <div className="w-[15%] bg-[#E1061E]" />
        <div className="w-[15%] bg-[#F7CC13]" />
      </div>

      {/* CABECERA DE COMPROBACIÓN EN VIVO Y ACTIVACIÓN */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                nucleoOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  nucleoOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
                }`}
              />
              <span>
                {nucleoOnline
                  ? `MOTOR MEJORANUCLEO SQLITE ACTIVO (127.0.0.1:4002 · ${latencyMs}ms)`
                  : 'MOTOR MEJORANUCLEO DESCONECTADO'}
              </span>
            </span>
            <span className="text-xs text-slate-300 font-mono">
              Base física: data/prospectos.db · SLA 48h & Atribución UTM Activos
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight font-spartan uppercase">
            Tablero Ejecutivo de Conversión Financiera & Consola SLA 48h
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleProbarCircuitoEnVivo}
            disabled={busyId === 'test-e2e'}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7CC13] hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <Zap className="h-4 w-4 text-[#E1061E]" />
            <span>
              {busyId === 'test-e2e'
                ? 'Inyectando Lead...'
                : '⚡ Comprobar Circuito: Simular Nuevo Lead con Atribución'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1A3D84] hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-blue-400/30"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Prospecto</span>
          </button>

          <button
            type="button"
            onClick={cargarProspectos}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
            title="Sincronizar con SQLite ahora"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* BANNER DE EVIDENCIA EN VIVO CUANDO SE EJECUTA UNA ACCIÓN */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-3 flex items-center justify-between text-xs font-bold text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 underline ml-4 cursor-pointer"
          >
            Ocultar
          </button>
        </div>
      )}

      <div className="p-5 sm:p-6 space-y-6">
        {/* PARTE 1: TABLERO EJECUTIVO DE NEGOCIO (LEADS, CONVERSIÓN E INGRESOS) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#1A3D84]" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 font-spartan">
                1. Indicadores de Negocio, Conversión e Ingresos en Vivo
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Ticket Promedio Consultoría (USD):</span>
              <input
                type="number"
                value={ticketPromedioUsd}
                onChange={(e) => setTicketPromedioUsd(Math.max(100, Number(e.target.value) || 1500))}
                className="w-24 px-2 py-1 rounded border border-slate-300 font-bold text-slate-900 text-xs text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Leads Capturados */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase">
                <span>Leads en SQLite</span>
                <Target className="h-4 w-4 text-[#1A3D84]" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">{kpis.total}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {kpis.slaVerde} en término (&lt;24h) · {kpis.slaRojo} vencidos
              </p>
            </div>

            {/* Semáforo SLA 48h */}
            <div
              className={`rounded-xl border p-4 ${
                kpis.slaRojo > 0
                  ? 'border-rose-300 bg-rose-50/50'
                  : 'border-emerald-300 bg-emerald-50/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 uppercase">
                <span>Semáforo SLA 48h</span>
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-900 mt-1 tabular-nums">
                {kpis.slaRojo === 0 ? '100% OK' : `${kpis.slaRojo} Alerta`}
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {kpis.slaVerde} verdes · {kpis.slaAmarillo} amarillos · {kpis.slaRojo} rojos
              </p>
            </div>

            {/* Avance Comercial */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 uppercase">
                <span>En Ciclo Comercial</span>
                <TrendingUp className="h-4 w-4 text-blue-700" />
              </div>
              <p className="text-3xl font-extrabold text-blue-950 mt-1 tabular-nums">
                {kpis.avanzadosTotal}{' '}
                <span className="text-sm font-bold text-blue-700">({kpis.tasaAvancePct}%)</span>
              </p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                {kpis.calificados} calificados · {kpis.enSeguimiento} seguimiento · {kpis.ganados} ganados
              </p>
            </div>

            {/* Pipeline Ponderado */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/40 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 uppercase">
                <span>Pipeline Ponderado</span>
                <DollarSign className="h-4 w-4 text-amber-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-950 mt-1 tabular-nums">
                USD {kpis.pipelinePonderadoUsd.toLocaleString('es-AR')}
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Valor proyectado según etapa de cada lead
              </p>
            </div>

            {/* Ingresos Cerrados Ganados */}
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 uppercase">
                <span>Ventas Cerradas</span>
                <Trophy className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1 tabular-nums">
                USD {kpis.ingresosFacturadosUsd.toLocaleString('es-AR')}
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {kpis.ganados} cierres ganados confirmados
              </p>
            </div>
          </div>

          {/* DESGLOSE DE ATRIBUCIÓN POR PIEZA DE CONTENIDO Y BUYER PERSONA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  🎯 Conversión por Buyer Persona 4D (Diagnóstico + Web + Base)
                </span>
                {onNavigateView && (
                  <button
                    type="button"
                    onClick={() => onNavigateView('contactos')}
                    className="text-[11px] font-bold text-[#1A3D84] hover:underline cursor-pointer"
                  >
                    Ir a Base Contactos →
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(kpis.porPersona).map(([bp, data]) => (
                  <div
                    key={bp}
                    className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                      PERSONA_NAMES[bp]?.color || 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="font-bold">{PERSONA_NAMES[bp]?.label || bp}:</span>
                    <span className="font-mono font-extrabold">{data.total} leads</span>
                    {data.avanzados > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 font-semibold">
                        {data.avanzados} avanzados
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  📣 Atribución por Pieza de Contenido (MejoraSM UTMs)
                </span>
                {onNavigateView && (
                  <button
                    type="button"
                    onClick={() => onNavigateView('sm')}
                    className="text-[11px] font-bold text-[#1A3D84] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Share2 className="h-3 w-3" />
                    <span>Abrir Grilla MejoraSM →</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(kpis.porPieza).length === 0 ? (
                  <span className="text-xs text-slate-500">Sin piezas atribuidas aún.</span>
                ) : (
                  Object.entries(kpis.porPieza).map(([pieza, info]) => (
                    <div
                      key={pieza}
                      className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 text-blue-950 text-xs flex items-center gap-2"
                    >
                      <span className="font-mono font-bold">{pieza}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white border border-blue-200 text-blue-800">
                        {info.canal}
                      </span>
                      <span className="font-extrabold text-emerald-700">{info.total} leads</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FORMULARIO RÁPIDO DE ALTA DE PROSPECTO (SI ESTÁ ABIERTO) */}
        {showNewForm && (
          <form
            onSubmit={handleCrearManual}
            className="rounded-xl border-2 border-[#1A3D84]/30 bg-blue-50/30 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1A3D84]">
                Registrar Nuevo Prospecto en MejoraNucleo (SQLite)
              </h4>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <input
                type="text"
                required
                placeholder="Nombre y Empresa *"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
              />
              <input
                type="email"
                required
                placeholder="Email *"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
              />
              <input
                type="text"
                placeholder="WhatsApp (+549...)"
                value={newTelefono}
                onChange={(e) => setNewTelefono(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
              />
              <select
                value={newCanal}
                onChange={(e) => setNewCanal(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs"
              >
                <option value="diagnostico_4d">Diagnóstico 4D</option>
                <option value="mejoraok_landing">Web Mejoraok</option>
                <option value="base_propia_contactos">Base Contactos</option>
                <option value="social_media_utm">Social Media UTM</option>
                <option value="crm_manual">CRM Manual</option>
              </select>
              <select
                value={newPersona}
                onChange={(e) => setNewPersona(e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-xs"
              >
                <option value="SATURADO">Fundador Saturado</option>
                <option value="AREA_COMERCIAL_SIN_RESULTADOS">Comercial sin Conversión</option>
                <option value="SIN_PROFESIONALIZAR_LA_EMPRESA">Empresa sin Procesos</option>
                <option value="EQUIPO_DESALINEADO">Equipo Desalineado</option>
              </select>
              <button
                type="submit"
                disabled={busyId === 'new-form'}
                className="px-4 py-2 rounded-lg bg-[#1A3D84] hover:bg-blue-900 text-white font-bold text-xs cursor-pointer"
              >
                {busyId === 'new-form' ? 'Guardando...' : 'Guardar en SQLite'}
              </button>
            </div>
          </form>
        )}

        {/* PARTE 2: CONSOLA OPERATIVA DE PROSPECTOS CON SEMÁFORO SLA 48H */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#1A3D84]" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 font-spartan">
                2. Consola Operativa de Prospectos · Semáforo SLA 48h & Aceleración WhatsApp
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Hacé clic en <strong>Calificar</strong>, <strong>Seguimiento</strong>,{' '}
              <strong>WhatsApp</strong> o <strong>Ganado</strong> para operar el ciclo en vivo.
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  <th className="py-3 px-4">Prospecto & Contacto</th>
                  <th className="py-3 px-4">Canal, Pieza UTM & Buyer Persona</th>
                  <th className="py-3 px-4">Semáforo SLA (48h)</th>
                  <th className="py-3 px-4">Estado Actual</th>
                  <th className="py-3 px-4 text-right">Acciones Comerciales (1-Clic)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {prospectos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No hay prospectos cargados. Usá el botón amarillo superior para inyectar un lead de prueba.
                    </td>
                  </tr>
                ) : (
                  prospectos.map((p) => {
                    const cleanPhone = (p.telefono || '').replace(/[^\d]/g, '');
                    const waMsg =
                      p.estado === 'CAPTURADO'
                        ? `Hola ${p.nombre.split(' ')[0]}, recibimos tu diagnóstico en Mejora Continua. ¿Coordinamos 15 minutos esta semana para revisar tu plan de acción?`
                        : `Hola ${p.nombre.split(' ')[0]}, te contacto desde Mejora Continua para avanzar con los próximos pasos de profesionalización.`;
                    const waHref = cleanPhone
                      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`
                      : null;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-slate-900 text-sm">{p.nombre}</div>
                          <div className="text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                            <span>{p.email}</span>
                            {p.telefono && <span>· {p.telefono}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                              {CANAL_NAMES[p.canalOrigen] || p.canalOrigen}
                            </span>
                            {p.piezaIdAtribucion && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-mono font-bold text-[10px]">
                                {p.piezaIdAtribucion}
                              </span>
                            )}
                          </div>
                          {p.buyerPersonaId && (
                            <div className="mt-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${
                                  PERSONA_NAMES[p.buyerPersonaId]?.color ||
                                  'bg-amber-50 border-amber-200 text-amber-900'
                                }`}
                              >
                                🎯 {PERSONA_NAMES[p.buyerPersonaId]?.label || p.buyerPersonaId}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          {p.slaEstado === 'ROJO' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px]">
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                              SLA VENCIDO (&gt;48h)
                            </span>
                          )}
                          {p.slaEstado === 'AMARILLO' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
                              <Clock className="h-3.5 w-3.5 text-amber-700" />
                              {p.slaHorasRestantes}h restantes
                            </span>
                          )}
                          {p.slaEstado === 'VERDE' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {p.slaHorasRestantes}h restantes (En término)
                            </span>
                          )}
                          {p.slaEstado === 'CUMPLIDO' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              SLA Atendido
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 align-top">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md font-bold text-[11px] border ${
                              p.estado === 'CERRADO_GANADO'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : p.estado === 'EN_SEGUIMIENTO'
                                ? 'bg-purple-50 text-purple-900 border-purple-200'
                                : p.estado === 'CALIFICADO'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : p.estado === 'CERRADO_PERDIDO'
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : 'bg-blue-50 text-blue-900 border-blue-200'
                            }`}
                          >
                            {p.estado}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {p.estado === 'CAPTURADO' && (
                              <button
                                type="button"
                                disabled={busyId === p.id}
                                onClick={() => handleTransicion(p.id, 'calificar')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Calificar</span>
                              </button>
                            )}

                            {p.estado === 'CALIFICADO' && (
                              <button
                                type="button"
                                disabled={busyId === p.id}
                                onClick={() => handleTransicion(p.id, 'seguimiento')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                                <span>Seguimiento</span>
                              </button>
                            )}

                            {p.estado === 'EN_SEGUIMIENTO' && (
                              <button
                                type="button"
                                disabled={busyId === p.id}
                                onClick={() => handleTransicion(p.id, 'ganado')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                              >
                                <Trophy className="h-3.5 w-3.5" />
                                <span>Cerrar Ganado</span>
                              </button>
                            )}

                            {(p.estado === 'CALIFICADO' || p.estado === 'EN_SEGUIMIENTO') && (
                              <button
                                type="button"
                                disabled={busyId === p.id}
                                onClick={() => handleTransicion(p.id, 'perdido')}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 font-semibold text-xs cursor-pointer"
                                title="Marcar como Cerrado Perdido"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {waHref && (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs"
                                title="Disparar mensaje de aceleración en WhatsApp"
                              >
                                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleVerAuditoria(p)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs cursor-pointer"
                              title="Ver traza inmutable en SQLite (prospecto_eventos_log)"
                            >
                              <History className="h-3.5 w-3.5" />
                              <span>Log</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL INLINE DE AUDITORÍA SQLITE (SI SE SELECCIONÓ UN PROSPECTO) */}
        {auditProspecto && (
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#1A3D84]" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Auditoría Append-Only SQLite — {auditProspecto.nombre}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setAuditProspecto(null)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>
            {loadingAudit ? (
              <p className="text-xs text-slate-500">Consultando tabla prospecto_eventos_log...</p>
            ) : auditEvents.length === 0 ? (
              <p className="text-xs text-slate-500">Sin eventos registrados.</p>
            ) : (
              <div className="space-y-1.5">
                {auditEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-[#1A3D84] mr-2">[{ev.evento}]</span>
                      <span className="text-slate-700">{ev.detalles}</span>
                      {ev.estadoAnterior && (
                        <span className="ml-2 font-mono text-[11px] text-slate-500">
                          ({ev.estadoAnterior} → {ev.estadoNuevo})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(ev.timestamp).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

