import React, { useState, useEffect } from 'react';
import { X, Award, Sparkles, Check, RefreshCw, FileCode, CheckCircle2, AlertCircle, TrendingUp, Send } from 'lucide-react';

interface SemillaItem {
  id: number;
  titulo: string;
  hook: string;
  body: string;
  cta: string;
  canal_id: number;
  alcance: number;
  clics: number;
  interacciones: number;
  compartidos: number;
  tasa_conversion?: number;
}

const DEFAULT_SEMILLAS: SemillaItem[] = [
  {
    id: 101,
    titulo: 'No vendés poco. Vendés a ciegas.',
    hook: 'No vendés poco. Vendés a ciegas.',
    body: 'Si hoy no podés responder cuánto te deja realmente cada cliente ni en qué etapa exacta de tu embudo se están enfriando las oportunidades, tu problema no es de demanda: es de trazabilidad.\n\nUn negocio no se vuelve predecible trayendo más leads al desorden, sino sabiendo con precisión quirúrgica qué pasa con cada conversación que ya entró. Cuando no medís la conversión real, cada decisión comercial es una apuesta a ciegas y el esfuerzo del equipo se diluye en intuiciones.',
    cta: 'Si querés dejar de adivinar y empezar a tomar decisiones comerciales sobre números reales, ya sabés dónde encontrarme.',
    canal_id: 3,
    alcance: 3450,
    clics: 260,
    interacciones: 290,
    compartidos: 38,
    tasa_conversion: 0.0754
  },
  {
    id: 102,
    titulo: 'Facturás más y trabajás peor. Eso no es crecimiento.',
    hook: 'Facturás más que el año pasado y trabajás peor que nunca. Eso no es crecimiento: es inflación operativa.',
    body: 'Cuando el volumen de ventas sube pero la tranquilidad y la rentabilidad bajan, el problema no es el mercado ni tu equipo. Es que seguís operando con la lógica de un negocio chico cuando la escala ya te exige profesionalización.\n\nCrecer no es meter más horas tuyas adentro de la máquina para apagar incendios; es diseñar los engranajes para que la estructura funcione con fluidez sin depender de que vos estés en cada detalle. Ordenar no es frenar: es la única forma de sostener el avance.',
    cta: 'No tenés por qué seguir decidiendo en soledad ni esperando al colapso para ordenar tu operación. Escribime y revisamos dónde está trabado el flujo.',
    canal_id: 3,
    alcance: 4120,
    clics: 295,
    interacciones: 360,
    compartidos: 58,
    tasa_conversion: 0.0716
  },
  {
    id: 103,
    titulo: 'Tenés WhatsApp, CRM y facturación. Ninguno se habla.',
    hook: 'Tenés WhatsApp, CRM y facturación. El problema es que ninguno de los tres se habla con el otro.',
    body: 'Sumar software sin conectar procesos no moderniza tu empresa: multiplica el caos. Cuando el cliente te escribe por un canal, el presupuesto viaja por otro y la entrega se pierde en una planilla, el cuello de botella no es la tecnología, es la falta de arquitectura operativa.\n\nLa rentabilidad se filtra en las horas que tu equipo pasa haciendo de puente humano entre sistemas que deberían entenderse solos. Antes de sumar una herramienta más, hay que ordenar cómo fluye la información.',
    cta: 'Si tu estructura hoy es un cuello de botella que te impide dirigir, ya sabés dónde encontrarme. Escribime y empezamos a destrabar esto.',
    canal_id: 1,
    alcance: 3840,
    clics: 248,
    interacciones: 312,
    compartidos: 45,
    tasa_conversion: 0.0646
  }
];

interface SemillasOroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjected?: () => void;
}

export const SemillasOroModal: React.FC<SemillasOroModalProps> = ({
  isOpen,
  onClose,
  onInjected
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [semillas, setSemillas] = useState<SemillaItem[]>(DEFAULT_SEMILLAS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadSemillasFromDb();
  }, [isOpen]);

  const loadSemillasFromDb = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && window.suite?.db?.sm?.getSemillasOro) {
        const rows = await window.suite.db.sm.getSemillasOro();
        if (Array.isArray(rows) && rows.length > 0) {
          const mapped: SemillaItem[] = rows.map((r, i) => ({
            id: r.id || (101 + i),
            titulo: r.titulo || DEFAULT_SEMILLAS[i]?.titulo || 'Semilla de Oro',
            hook: r.hook || DEFAULT_SEMILLAS[i]?.hook || '',
            body: r.body || DEFAULT_SEMILLAS[i]?.body || '',
            cta: r.cta || DEFAULT_SEMILLAS[i]?.cta || '',
            canal_id: r.canal_id || DEFAULT_SEMILLAS[i]?.canal_id || 3,
            alcance: r.alcance || DEFAULT_SEMILLAS[i]?.alcance || 1000,
            clics: r.clics || DEFAULT_SEMILLAS[i]?.clics || 50,
            interacciones: r.interacciones || DEFAULT_SEMILLAS[i]?.interacciones || 80,
            compartidos: r.compartidos || DEFAULT_SEMILLAS[i]?.compartidos || 10,
            tasa_conversion: r.tasa_conversion || DEFAULT_SEMILLAS[i]?.tasa_conversion || 0.05
          }));
          setSemillas(mapped);
        }
      }
    } catch (err: any) {
      console.warn('[SemillasOroModal] Error cargando de SQLite:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentField = (field: keyof SemillaItem, value: any) => {
    setSemillas(prev => {
      const next = [...prev];
      next[activeTab] = {
        ...next[activeTab],
        [field]: value
      };
      if (field === 'alcance' || field === 'clics') {
        const alc = field === 'alcance' ? Number(value) : Number(next[activeTab].alcance);
        const clk = field === 'clics' ? Number(value) : Number(next[activeTab].clics);
        next[activeTab].tasa_conversion = alc > 0 ? clk / alc : 0;
      }
      return next;
    });
  };

  const handleSaveToSqlite = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      if (typeof window !== 'undefined' && window.suite?.db?.sm?.injectSemillasOro) {
        const res = await window.suite.db.sm.injectSemillasOro(semillas);
        if (res.success) {
          setStatusMessage({
            type: 'success',
            text: `¡Inyección Exitosa! Las 3 Semillas de Oro quedaron persistidas en SQLite y calibradas en Gemini Pro.`
          });
          onInjected?.();
        } else {
          setStatusMessage({
            type: 'error',
            text: `Error al inyectar: ${res.error || 'Falla desconocida'}`
          });
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Entorno de Electron no disponible. Ejecutá "arrancar.bat" para inicializar el centro de control.'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error de persistencia: ${err.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSemillas(DEFAULT_SEMILLAS);
    setStatusMessage({
      type: 'success',
      text: 'Semillas restablecidas a los 3 posts B2B de alto impacto predeterminados.'
    });
  };

  if (!isOpen) return null;

  const current = semillas[activeTab] || DEFAULT_SEMILLAS[0];
  const conversionRate = current.alcance > 0 ? ((current.clics / current.alcance) * 100).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-mc-amarillo/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-modelica">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-mc-azul-dark/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mc-amarillo/10 border border-mc-amarillo/30 flex items-center justify-center text-mc-amarillo shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white font-spartan uppercase tracking-wide">
                  Semillas de Oro · Cold Start
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-mc-amarillo/20 text-mc-amarillo text-[10px] font-bold font-mono">
                  ADN Ganador B2B
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Los 3 posts históricos con mayor conversión que alimentan el criterio estratégico de Gemini 1.5 Pro.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 pb-2 border-b border-white/10 bg-slate-950 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {semillas.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveTab(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === idx
                    ? 'bg-mc-amarillo text-mc-slate shadow-sm'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>Semilla #{idx + 1}</span>
                <span className="text-[10px] opacity-80 font-mono">
                  ({s.alcance > 0 ? ((s.clics / s.alcance) * 100).toFixed(1) : '0'}%)
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Persistencia SQLite Local
            </span>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Post Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-mc-azul-surface/40 border border-white/5">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Alcance (Impresiones)</label>
              <input
                type="number"
                value={current.alcance}
                onChange={(e) => updateCurrentField('alcance', Number(e.target.value))}
                className="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-mc-amarillo outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Clics (Conversión)</label>
              <input
                type="number"
                value={current.clics}
                onChange={(e) => updateCurrentField('clics', Number(e.target.value))}
                className="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:border-mc-amarillo outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400">Interacciones</label>
              <input
                type="number"
                value={current.interacciones}
                onChange={(e) => updateCurrentField('interacciones', Number(e.target.value))}
                className="w-full mt-1 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-mc-amarillo outline-none"
              />
            </div>
            <div className="flex flex-col justify-center items-center rounded-lg bg-mc-amarillo/10 border border-mc-amarillo/20 p-1">
              <span className="text-[10px] uppercase font-bold text-mc-amarillo flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Tasa Conversión
              </span>
              <span className="text-lg font-extrabold text-mc-amarillo font-mono mt-0.5">
                {conversionRate}%
              </span>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-spartan font-bold uppercase text-slate-300 mb-1">
              Título del Post Ganador
            </label>
            <input
              type="text"
              value={current.titulo}
              onChange={(e) => updateCurrentField('titulo', e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-mc-amarillo outline-none transition-colors"
              placeholder="Ej: No vendés poco. Vendés a ciegas."
            />
          </div>

          {/* Gancho (Hook) */}
          <div>
            <label className="block text-xs font-spartan font-bold uppercase text-slate-300 mb-1">
              Gancho (Hook) · Dolor del Líder sin Juzgar
            </label>
            <input
              type="text"
              value={current.hook}
              onChange={(e) => updateCurrentField('hook', e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-mc-amarillo outline-none transition-colors"
              placeholder="Gancho de apertura contundente..."
            />
          </div>

          {/* Cuerpo (Body) */}
          <div>
            <label className="block text-xs font-spartan font-bold uppercase text-slate-300 mb-1">
              Cuerpo (Lógica y Profesionalización)
            </label>
            <textarea
              rows={4}
              value={current.body}
              onChange={(e) => updateCurrentField('body', e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-xs text-slate-200 focus:border-mc-amarillo outline-none transition-colors leading-relaxed font-sans"
              placeholder="Desarrollo del post con foco en causa raíz y estructura..."
            />
          </div>

          {/* Llamado a la Acción (CTA) */}
          <div>
            <label className="block text-xs font-spartan font-bold uppercase text-slate-300 mb-1">
              Cierre / CTA Mind-Reader (Alivio y Autoridad)
            </label>
            <input
              type="text"
              value={current.cta}
              onChange={(e) => updateCurrentField('cta', e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-mc-amarillo font-medium focus:border-mc-amarillo outline-none transition-colors"
              placeholder="Ej: Si tu estructura hoy es un cuello de botella, ya sabés dónde encontrarme."
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileCode className="w-3.5 h-3.5 text-mc-amarillo" />
            <span>Archivo SQL editable: <code className="text-mc-amarillo font-mono">c:\github\semillas_oro.sql</code></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              Restaurar Predeterminados
            </button>
            <button
              onClick={handleSaveToSqlite}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-spartan font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Inyectando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Inyectar en SQLite Ahora</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemillasOroModal;
