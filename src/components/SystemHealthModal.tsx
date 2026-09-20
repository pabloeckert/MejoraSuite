import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, Server, Clock } from 'lucide-react';
import { TelemetryData } from '../services/telemetryService';

interface SystemHealthModalProps {
  telemetry: TelemetryData;
  onClose: () => void;
}

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({
  telemetry,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/20 p-6 shadow-2xl bg-mc-slate/95">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-mc-amarillo/10 text-mc-amarillo">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-spartan uppercase">
                Estado de Nodos del Ecosistema
              </h3>
              <p className="text-xs text-slate-400">
                Auditoría en vivo desde Supabase Central ('tzatuvxatsduuslxqdtm')
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Summary */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-spartan uppercase tracking-wider text-slate-400">Total Contactos</span>
            <div className="text-xl font-bold text-white mt-0.5">{telemetry.totalContactos}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-spartan uppercase tracking-wider text-slate-400">Nuevos (24h)</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">+{telemetry.contactos24h}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-spartan uppercase tracking-wider text-slate-400">Latencia</span>
            <div className="text-xl font-bold text-mc-amarillo mt-0.5">{telemetry.latencyMs} ms</div>
          </div>
        </div>

        {/* Systems List */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {telemetry.detallesSistemas.length > 0 ? (
            telemetry.detallesSistemas.map((sys) => (
              <div
                key={sys.sistema}
                className="flex items-center justify-between p-3.5 rounded-xl bg-mc-azul-surface/40 border border-white/5 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{sys.sistema}</span>
                      {sys.puede_escribir && (
                        <span className="text-[9px] font-spartan uppercase tracking-wider px-1.5 py-0.2 rounded bg-mc-amarillo/15 text-mc-amarillo border border-mc-amarillo/30">
                          Lectura / Escritura
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Último uso: {new Date(sys.ultimo_uso_en).toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Activo
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-sm text-slate-400">
              Cargando auditoría de nodos en tiempo real...
            </div>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-mc-amarillo hover:bg-mc-amarillo-hover text-mc-negro font-spartan font-bold text-xs uppercase tracking-wide transition-all cursor-pointer"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
