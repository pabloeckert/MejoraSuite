import React from 'react';
import { Users, UserPlus, Server, Network, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { TelemetryData } from '../services/telemetryService';

interface TelemetryBarProps {
  telemetry: TelemetryData;
  loading: boolean;
  onOpenHealth: () => void;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  telemetry,
  loading,
  onOpenHealth,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* KPI 1: Total Contactos */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group border-l-4 border-l-mc-amarillo shadow-card-glow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-400">
            Identidades Universales
          </span>
          <div className="p-2 rounded-xl bg-mc-amarillo/10 text-mc-amarillo">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {loading ? '...' : telemetry.totalContactos}
          </span>
          <span className="text-xs font-semibold text-emerald-400 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 inline" /> persona_id
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Base maestra en <span className="text-mc-amarillo font-semibold">contactos_finales</span> (Supabase central).
        </p>
      </div>

      {/* KPI 2: Capturas 24h */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group border-l-4 border-l-emerald-400 shadow-card-glow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-400">
            Ingresos Últimas 24h
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            +{loading ? '...' : telemetry.contactos24h}
          </span>
          <span className="text-xs font-medium text-slate-400">nuevos leads</span>
        </div>
        <p className="text-xs text-slate-300">
          Capturados en Diagnóstico, Web y Social Media.
        </p>
      </div>

      {/* KPI 3: Gateway Status */}
      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group border-l-4 border-l-mc-azul shadow-card-glow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-400">
            Gateway contactos-api
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <Server className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {telemetry.gatewayStatus === 'online' ? '200 OK' : 'Alerta'}
          </span>
          <span className="text-xs font-mono text-emerald-400">
            {telemetry.latencyMs} ms
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Edge Function con autenticación SHA-256 activa.
        </p>
      </div>

      {/* KPI 4: Red Ecosistema */}
      <div
        onClick={onOpenHealth}
        className="glass-panel rounded-2xl p-5 relative overflow-hidden group border-l-4 border-l-indigo-400 hover:border-mc-amarillo transition-all cursor-pointer shadow-card-glow"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-400">
            Nodos del Ecosistema
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-mc-amarillo/10 group-hover:text-mc-amarillo transition-colors">
            <Network className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {telemetry.sistemasConectados.length}/7
          </span>
          <span className="text-xs font-medium text-mc-amarillo inline-flex items-center">
            Ver detalles <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Sistemas interconectados en horizontal sin silos.
        </p>
      </div>
    </div>
  );
};
