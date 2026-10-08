import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Header, SuiteView } from './components/Header';
import { TelemetryBar } from './components/TelemetryBar';
import { LauncherMatrix } from './components/LauncherMatrix';
import { SystemHealthModal } from './components/SystemHealthModal';
import { SemillasOroModal } from './components/SemillasOroModal';
import { EmbeddedAppViewer } from './components/EmbeddedAppViewer';
import { fetchTelemetry, TelemetryData } from './services/telemetryService';
import { ShieldCheck, Compass, Zap, Layers, Database, ArrowLeft, Briefcase, Sparkles, Share2, MessageCircle, Award, FileText, TrendingUp, Users2, Globe } from 'lucide-react';
import { CrmApp, CrmNucleoWidget } from '@mejora/crm';
import { ContactosApp, ContactosNucleoWidget } from '@mejora/contactos';
import { SmApp } from '@mejora/sm';
import { WaDashboard } from './components/whatsapp/WaDashboard';

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
  const [activeView, setActiveView] = useState<SuiteView>('hub');
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry);
  const [loading, setLoading] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [semillasModalOpen, setSemillasModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; tableCount: number; tables: string[] } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTelemetry();
      if (data && typeof data === 'object') {
        setTelemetry(data);
      }
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
    <div className="bg-white text-slate-900 min-h-screen flex flex-col font-modelica">
      {/* Header unificado con selector de espacios */}
      <Header
        telemetry={telemetry}
        loading={loading}
        onRefresh={loadData}
        onOpenHealth={() => setHealthModalOpen(true)}
        onOpenSemillas={() => setSemillasModalOpen(true)}
        activeView={activeView}
        onViewChange={(v) => setActiveView(v)}
      />

      {/* Vista 1: Hub Central / Launcher */}
      {activeView === 'hub' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mc-amarillo/10 border border-mc-amarillo/30 text-amber-700 text-xs font-spartan font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>suite.mejoraok.com · En Vivo</span>
              </div>
              {dbStatus?.connected && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-spartan font-bold uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SQLite Núcleo Activo ({dbStatus.tableCount} Tablas)</span>
                </div>
              )}
              <button
                onClick={() => setSemillasModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 hover:border-amber-400 text-amber-800 text-xs font-spartan font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm hover:bg-amber-100"
                title="Ver y configurar los 3 posts históricos con mayor conversión (ADN Ganador)"
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Semillas de Oro (Cold Start Activo)</span>
              </button>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight uppercase font-spartan mb-3">
              Centro de Control <span className="text-mc-azul">de Conversión</span>
            </h1>
            <p className="text-base text-slate-600 max-w-3xl leading-relaxed">
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

          {/* Launcher & Hook Matrix con navegación interna */}
          <LauncherMatrix
            telemetry={telemetry}
            onNavigate={(view) => setActiveView(view)}
          />

          {/* Módulos Monorepo Integrados: @mejora/crm y @mejora/contactos con SQLite @mejora/nucleo */}
          <section className="mt-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-mc-azul" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-wide">
                    Integración de Espacios de Trabajo (Monorepo @mejora)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Componentes de <span className="text-mc-azul font-semibold">@mejora/crm</span> y <span className="text-teal-600 font-semibold">@mejora/contactos</span> leyendo y escribiendo en la base de datos local SQLite <span className="text-emerald-600 font-semibold">@mejora/nucleo</span>.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <CrmNucleoWidget />
                <button
                  onClick={() => setActiveView('crm')}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>Abrir App Completa de CRM</span>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <ContactosNucleoWidget />
                <button
                  onClick={() => setActiveView('contactos')}
                  className="w-full py-2 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Abrir App Completa de Contactos</span>
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Vista 2: Aplicación Completa de CRM (Renderizado Local) */}
      {activeView === 'crm' && (
        <div className="flex-1 flex flex-col bg-white animate-fadeIn">
          {/* Subheader de Control para CRM */}
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView('hub')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-300 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-mc-azul" />
                <span>Volver a Suite Hub</span>
              </button>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-900">
                  MejoraCRM
                </span>
                <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-mono">
                  Persistencia SQLite Conectada
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">
              Pipeline de Ventas y Deals Soberanos
            </div>
          </div>
          {/* Contenedor del CRM */}
          <div className="flex-1">
            <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando MejoraCRM...</div>}>
              <CrmApp />
            </Suspense>
          </div>
        </div>
      )}

      {/* Vista 3: Aplicación Completa de Contactos (Renderizado Local) */}
      {activeView === 'contactos' && (
        <div className="flex-1 flex flex-col bg-white animate-fadeIn">
          {/* Subheader de Control para Contactos */}
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView('hub')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-300 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-mc-azul" />
                <span>Volver a Suite Hub</span>
              </button>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-900">
                  MejoraContactos
                </span>
                <span className="text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full font-mono">
                  Deduplicación & Personas SQLite
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">
              Truth Engine de Identidad y Calidad de Datos
            </div>
          </div>
          {/* Contenedor de Contactos */}
          <div className="flex-1">
            <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando MejoraContactos...</div>}>
              <ContactosApp />
            </Suspense>
          </div>
        </div>
      )}

      {/* Vista 4: Aplicación Completa de Social Media (Renderizado Local) */}
      {activeView === 'sm' && (
        <div className="flex-1 flex flex-col bg-white animate-fadeIn">
          {/* Subheader de Control para Social Media */}
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView('hub')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-300 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-mc-azul" />
                <span>Volver a Suite Hub</span>
              </button>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-900">
                  MejoraSM
                </span>
                <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                  Social Media & Propuestas SQLite
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">
              Generación de Contenido, Bóveda y Calendario Editorial
            </div>
          </div>
          {/* Contenedor de Social Media */}
          <div className="flex-1">
            <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando MejoraSM...</div>}>
              <SmApp />
            </Suspense>
          </div>
        </div>
      )}

      {/* Vista 5: WhatsApp Engine (Renderizado Local) */}
      {activeView === 'wa' && (
        <div className="flex-1 flex flex-col bg-white animate-fadeIn">
          {/* Subheader de Control para WhatsApp */}
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView('hub')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-300 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-mc-azul" />
                <span>Volver a Suite Hub</span>
              </button>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span className="text-xs font-spartan font-bold uppercase tracking-wider text-slate-900">
                  MejoraWS
                </span>
                <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-mono">
                  Baileys & SQLite Núcleo
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">
              Motor de Sesiones, Envíos y Carpetas SQLite
            </div>
          </div>
          {/* Contenedor del Tablero WhatsApp */}
          <div className="flex-1">
            <WaDashboard />
          </div>
        </div>
      )}

      {/* Vista 6: MejoraDiagnostico Integrado */}
      {activeView === 'diagnostico' && (
        <EmbeddedAppViewer
          id="diagnostico"
          title="MejoraDiagnostico"
          badge="Boca de Captura Principal"
          category="Hook Pyme"
          categoryColor="bg-amber-50 text-amber-800 border-amber-200"
          icon={<FileText className="w-5 h-5 text-amber-600" />}
          defaultUrl="https://diagnostico.mejoraok.com"
          localUrl="http://localhost:3000"
          description="Test de diagnóstico empresarial en 8 dimensiones. Scoring automático, informe PDF y derivación directa a WhatsApp."
          onBack={() => setActiveView('hub')}
        />
      )}

      {/* Vista 7: MejoraDecisiones (Tablero Nash) Integrado */}
      {activeView === 'decisiones' && (
        <EmbeddedAppViewer
          id="decisiones"
          title="MejoraDecisiones"
          badge="Tablero Nash & Poder"
          category="Hook Alta Dirección"
          categoryColor="bg-cyan-50 text-cyan-800 border-cyan-200"
          icon={<TrendingUp className="w-5 h-5 text-cyan-600" />}
          defaultUrl="https://pabloeckert.github.io/MejoraDecisiones/"
          localUrl="http://localhost:5175"
          description="Simulador macro y teoría de juegos 2x2. Grafo interactivo de actores e indicadores BCRA/INDEC en vivo con modo dual oscuro/directorio."
          onBack={() => setActiveView('hub')}
        />
      )}

      {/* Vista 8: MejoraApp (Portal de Clientes PWA) Integrado */}
      {activeView === 'app' && (
        <EmbeddedAppViewer
          id="app"
          title="MejoraApp"
          badge="Portal Clientes PWA"
          category="Comunidad & Retención"
          categoryColor="bg-blue-50 text-blue-800 border-blue-200"
          icon={<Users2 className="w-5 h-5 text-blue-600" />}
          defaultUrl="https://app.mejoraok.com"
          localUrl="http://localhost:4173"
          description="Portal privado para líderes y miembros de comunidad. Muro interactivo, contenidos exclusivos y contraste calibrado para modo oscuro."
          onBack={() => setActiveView('hub')}
        />
      )}

      {/* Vista 9: Mejoraok (Web Institucional & Leads) Integrado */}
      {activeView === 'ok' && (
        <EmbeddedAppViewer
          id="ok"
          title="Mejoraok"
          badge="Front Door Institucional"
          category="Portal Institucional"
          categoryColor="bg-slate-100 text-slate-800 border-slate-200"
          icon={<Globe className="w-5 h-5 text-mc-azul" />}
          defaultUrl="https://mejoraok.com"
          localUrl="http://localhost:5173"
          description="Sitio institucional oficial de Mejora Continua. Manifiesto, oferta de servicios de consultoría y derivador estratégico."
          onBack={() => setActiveView('hub')}
        />
      )}

      {/* Health Modal */}
      {healthModalOpen && (
        <SystemHealthModal
          telemetry={telemetry}
          onClose={() => setHealthModalOpen(false)}
        />
      )}

      {/* Semillas de Oro Modal */}
      {semillasModalOpen && (
        <SemillasOroModal
          isOpen={semillasModalOpen}
          onClose={() => setSemillasModalOpen(false)}
        />
      )}

      {/* Footer solo visible en la vista Hub */}
      {activeView === 'hub' && (
        <footer className="border-t border-slate-200 bg-slate-50 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Mejora Continua®</span>
              <span>—</span>
              <span>Claridad estratégica para líderes, empresas y equipos</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <a
                href="https://mejoraok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-mc-azul transition-colors"
              >
                mejoraok.com
              </a>
              <span>·</span>
              <button
                onClick={() => setActiveView('crm')}
                className="hover:text-mc-azul transition-colors cursor-pointer"
              >
                CRM Local
              </button>
              <span>·</span>
              <button
                onClick={() => setActiveView('contactos')}
                className="hover:text-mc-azul transition-colors cursor-pointer"
              >
                Contactos Local
              </button>
              <span>·</span>
              <button
                onClick={() => setActiveView('sm')}
                className="hover:text-mc-azul transition-colors cursor-pointer"
              >
                Social Media Local
              </button>
              <span>·</span>
              <button
                onClick={() => setActiveView('wa')}
                className="hover:text-mc-azul transition-colors cursor-pointer"
              >
                WhatsApp Local
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
