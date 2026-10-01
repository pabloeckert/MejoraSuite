import { RefreshCw, Activity, ExternalLink, ShieldCheck, LayoutDashboard, Briefcase, Sparkles, Share2, MessageCircle } from 'lucide-react';
import { TelemetryData } from '../services/telemetryService';

interface HeaderProps {
  telemetry: TelemetryData;
  loading: boolean;
  onRefresh: () => void;
  onOpenHealth: () => void;
  activeView?: 'hub' | 'crm' | 'contactos' | 'sm' | 'wa';
  onViewChange?: (view: 'hub' | 'crm' | 'contactos' | 'sm' | 'wa') => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  loading,
  onRefresh,
  onOpenHealth,
  activeView = 'hub',
  onViewChange,
}) => {
  return (
    <header className="border-b border-white/10 bg-mc-azul-dark/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand Lockup & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onViewChange?.('hub')}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <img
              src="/brand/lockup-horizontal-color.png"
              alt="Mejora Continua"
              className="h-9 w-auto brightness-110 drop-shadow group-hover:opacity-90 transition-opacity"
            />
          </button>
          <div className="h-7 w-[1px] bg-white/20 hidden sm:block" />
          <div className="hidden sm:block">
            <div className="text-xs uppercase tracking-widest text-mc-amarillo font-spartan font-bold">
              MejoraSuite
            </div>
            <div className="text-sm font-semibold text-slate-200">
              Centro de Control Unificado
            </div>
          </div>
        </div>

        {/* Center: Internal Workspace Navigation Tabs */}
        {onViewChange && (
          <div className="hidden md:flex items-center p-1 rounded-xl bg-mc-azul-surface/80 border border-white/10">
            <button
              onClick={() => onViewChange('hub')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'hub'
                  ? 'bg-mc-amarillo text-mc-slate shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Hub</span>
            </button>
            <button
              onClick={() => onViewChange('crm')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'crm'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>CRM</span>
            </button>
            <button
              onClick={() => onViewChange('contactos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'contactos'
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Contactos</span>
            </button>
            <button
              onClick={() => onViewChange('sm')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'sm'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Social Media</span>
            </button>
            <button
              onClick={() => onViewChange('wa')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'wa'
                  ? 'bg-[#25D366] text-mc-slate shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        )}

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
            className="p-2 rounded-lg bg-mc-azul-surface/70 border border-white/10 hover:border-mc-amarillo/40 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Actualizar datos de telemetría"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-mc-amarillo' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
