import React from 'react';
import { RefreshCw, Activity, ExternalLink, ShieldCheck } from 'lucide-react';
import { TelemetryData } from '../services/telemetryService';

interface HeaderProps {
  telemetry: TelemetryData;
  loading: boolean;
  onRefresh: () => void;
  onOpenHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  loading,
  onRefresh,
  onOpenHealth,
}) => {
  return (
    <header className="border-b border-white/10 bg-mc-azul-dark/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand Lockup & Title */}
        <div className="flex items-center gap-4">
          <a href="https://mejoraok.com" target="_blank" rel="noopener noreferrer" className="group">
            <img
              src="/brand/lockup-horizontal-color.png"
              alt="Mejora Continua"
              className="h-9 w-auto brightness-110 drop-shadow group-hover:opacity-90 transition-opacity"
            />
          </a>
          <div className="h-7 w-[1px] bg-white/20 hidden sm:block" />
          <div className="hidden sm:block">
            <div className="text-xs uppercase tracking-widest text-mc-amarillo font-spartan font-bold">
              MejoraSuite
            </div>
            <div className="text-sm font-semibold text-slate-200">
              Centro de Control de Conversión
            </div>
          </div>
        </div>

        {/* Right: Telemetry status & Actions */}
        <div className="flex items-center gap-3">
          {/* Gateway Status Badge */}
          <button
            onClick={onOpenHealth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-mc-azul-surface/70 border border-white/10 hover:border-mc-amarillo/40 text-xs font-medium text-slate-200 transition-all hover:bg-mc-azul-surface cursor-pointer"
            title="Ver estado detallado de todos los nodos del ecosistema"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                telemetry.gatewayStatus === 'online'
                  ? 'bg-emerald-400 pulse-indicator'
                  : telemetry.gatewayStatus === 'degraded'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="hidden md:inline text-slate-300">Gateway:</span>
            <span className="font-semibold text-white">
              {telemetry.gatewayStatus === 'online' ? 'Conectado' : 'Revisar'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({telemetry.latencyMs}ms)
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-mc-amarillo ml-0.5" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Actualizar telemetría en vivo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-mc-amarillo' : ''}`} />
          </button>

          {/* Portal link */}
          <a
            href="https://mejoraok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mc-amarillo hover:bg-mc-amarillo-hover text-mc-negro font-spartan font-bold text-xs uppercase tracking-wide transition-all shadow-sm shadow-mc-amarillo/20"
          >
            <span>mejoraok.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};
