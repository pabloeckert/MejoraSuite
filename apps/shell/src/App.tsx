import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TelemetryBar } from './components/TelemetryBar';
import { LauncherMatrix } from './components/LauncherMatrix';
import { SystemHealthModal } from './components/SystemHealthModal';
import { fetchTelemetry, TelemetryData } from './services/telemetryService';
import { ShieldCheck, Compass, Zap, Layers, Database } from 'lucide-react';

const initialTelemetry: TelemetryData = {
  totalContactos: 20,
  contactos24h: 8,
  gatewayStatus: 'online',
  latencyMs: 140,
  sistemasConectados: [
    'MejoraApp',
    'MejoraCRM',
    'MejoraDiagnostico',
    'Mejoraok',
    'MejoraSM',
    'MejoraSuite',
    'MejoraWS',
  ],
  detallesSistemas: [],
  lastUpdated: '--:--',
  wsLocalOnline: false,
};

export function App() {
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry);
  const [loading, setLoading] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; tableCount: number; tables: string[] } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTelemetry();
      setTelemetry(data);
    } catch (err) {
      console.error('[App] Error al cargar telemetría:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).suite?.getDbStatus) {
      (window as any).suite.pingDb?.().then((res: any) => {
        console.log('[App] pingDb response:', res);
      });
      (window as any).suite.getDbStatus().then((status: any) => {
        console.log('[App] getDbStatus response:', status);
        if (status) setDbStatus(status);
      }).catch((e: any) => console.warn('[App] SQLite status check:', e));
    }
  }, []);

  return (
    <div className="min-h-screen bg-mc-slate text-slate-100 flex flex-col font-modelica">
      {/* Header */}
      <Header
        telemetry={telemetry}
        loading={loading}
        onRefresh={loadData}
        onOpenHealth={() => setHealthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mc-amarillo/10 border border-mc-amarillo/20 text-mc-amarillo text-xs font-spartan font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>suite.mejoraok.com · En Vivo</span>
            </div>
            {dbStatus?.connected && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-spartan font-bold uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" />
                <span>SQLite Núcleo Activo ({dbStatus.tableCount} Tablas)</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight uppercase font-spartan mb-3">
            Centro de Control <span className="text-mc-amarillo">de Conversión</span>
          </h1>
          <p className="text-base text-slate-300 max-w-3xl leading-relaxed">
            Plataforma unificada del ecosistema Mejora Continua. Vinculación horizontal de
            canales de captación, fuente de verdad de identidad y aceleración del pipeline comercial.
          </p>
        </div>

        {/* Live Telemetry Bar */}
        <TelemetryBar
          telemetry={telemetry}
          loading={loading}
          onOpenHealth={() => setHealthModalOpen(true)}
        />

        {/* Launcher & Hook Matrix */}
        <LauncherMatrix telemetry={telemetry} />
      </main>

      {/* Health Modal */}
      {healthModalOpen && (
        <SystemHealthModal
          telemetry={telemetry}
          onClose={() => setHealthModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 bg-mc-azul-dark/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">Mejora Continua®</span>
            <span>·</span>
            <span>Claridad estratégica para líderes, empresas y equipos</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://mejoraok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-mc-amarillo transition-colors"
            >
              mejoraok.com
            </a>
            <span>·</span>
            <a
              href="https://diagnostico.mejoraok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-mc-amarillo transition-colors"
            >
              Diagnóstico
            </a>
            <span>·</span>
            <a
              href="https://crm.mejoraok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-mc-amarillo transition-colors"
            >
              CRM
            </a>
            <span>·</span>
            <span className="text-slate-500">v2.0 Web</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
