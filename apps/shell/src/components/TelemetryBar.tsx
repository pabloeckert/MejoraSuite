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
      <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group border-l-4 border-l-mc-amarillo shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-500">
            Identidades Universales
          </span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {loading ? '...' : telemetry.totalContactos}
          </span>
          <span className="text-xs font-semibold text-emerald-600 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 inline" /> persona_id
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Base maestra en <span className="text-mc-azul font-semibold">contactos_finales</span> (Supabase central).
        </p>
      </div>

      {/* KPI 2: Capturas 24h */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-500">
            Ingresos Últimas 24h
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            +{loading ? '...' : telemetry.contactos24h}
          </span>
          <span className="text-xs font-medium text-slate-500">nuevos leads</span>
        </div>
        <p className="text-xs text-slate-500">
          Capturados en Diagnóstico, Web y Social Media.
        </p>
      </div>

      {/* KPI 3: Gateway Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group border-l-4 border-l-mc-azul shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-500">
            Gateway contactos-api
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Server className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            {telemetry.gatewayStatus === 'online' ? '200 OK' : 'Alerta'}
          </span>
          <span className="text-xs font-mono text-emerald-600">
            {telemetry.latencyMs} ms
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Edge Function con autenticación SHA-256 activa.
        </p>
      </div>

      {/* KPI 4: Red Ecosistema */}
      <div
        onClick={onOpenHealth}
        className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group border-l-4 border-l-indigo-500 hover:border-mc-azul transition-all cursor-pointer shadow-sm hover:shadow-md"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-500">
            Nodos del Ecosistema
          </span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-blue-50 group-hover:text-mc-azul transition-colors">
            <Network className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {telemetry.sistemasConectados.length}/7
          </span>
          <span className="text-xs font-medium text-mc-azul inline-flex items-center">
            Ver detalles <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Sistemas interconectados en horizontal sin silos.
        </p>
      </div>
    </div>
  );
};
