import { RefreshCw, Activity, ExternalLink, ShieldCheck, LayoutDashboard, Briefcase, Sparkles, Share2, MessageCircle, Award } from 'lucide-react';
import { TelemetryData } from '../services/telemetryService';

interface HeaderProps {
  telemetry: TelemetryData;
  loading: boolean;
  onRefresh: () => void;
  onOpenHealth: () => void;
  onOpenSemillas?: () => void;
  activeView?: 'hub' | 'crm' | 'contactos' | 'sm' | 'wa';
  onViewChange?: (view: 'hub' | 'crm' | 'contactos' | 'sm' | 'wa') => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  loading,
  onRefresh,
  onOpenHealth,
  onOpenSemillas,
  activeView = 'hub',
  onViewChange,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
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
              className="h-16 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </button>
          <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
          <div className="hidden sm:block">
            <div className="text-xs uppercase tracking-widest text-mc-azul font-spartan font-bold">
              MejoraSuite
            </div>
            <div className="text-sm font-semibold text-slate-800">
              Centro de Control Unificado
            </div>
          </div>
        </div>

        {/* Center: Internal Workspace Navigation Tabs */}
        {onViewChange && (
          <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => onViewChange('hub')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'hub'
                  ? 'bg-mc-azul text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Hub</span>
            </button>
            <button
              onClick={() => onViewChange('crm')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'crm'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>CRM</span>
            </button>
            <button
              onClick={() => onViewChange('contactos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'contactos'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Contactos</span>
            </button>
            <button
              onClick={() => onViewChange('sm')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'sm'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Social Media</span>
            </button>
            <button
              onClick={() => onViewChange('wa')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-spartan font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeView === 'wa'
                  ? 'bg-[#25D366] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        )}

        {/* Right: Telemetry status & Actions */}
        <div className="flex items-center gap-3">
          {/* Semillas de Oro Button */}
          {onOpenSemillas && (
            <button
              onClick={onOpenSemillas}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 hover:border-amber-400 text-xs font-bold text-amber-800 transition-all cursor-pointer shadow-sm hover:bg-amber-100 font-spartan uppercase tracking-wider"
              title="Administrar las 3 Semillas de Oro (Cold Start) para Gemini Pro"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Semillas de Oro</span>
            </button>
          )}

          {/* Gateway Status Badge */}
          <button
            onClick={onOpenHealth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-700 transition-all hover:bg-slate-200/60 cursor-pointer"
            title="Ver estado detallado de todos los nodos del ecosistema"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                telemetry.gatewayStatus === 'online'
                  ? 'bg-emerald-500 pulse-indicator'
                  : telemetry.gatewayStatus === 'degraded'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="hidden md:inline text-slate-500">Gateway:</span>
            <span className="font-semibold text-slate-900">
              {telemetry.gatewayStatus === 'online' ? 'Conectado' : 'Revisar'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({telemetry.latencyMs}ms)
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-mc-azul ml-0.5" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50"
            title="Actualizar datos de telemetría"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-mc-azul' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
