import React, { useState } from 'react';
import {
  ArrowLeft,
  RotateCw,
  ExternalLink,
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Globe,
  Zap,
  ShieldCheck
} from 'lucide-react';

export interface EmbeddedAppProps {
  id: string;
  title: string;
  badge: string;
  category: string;
  categoryColor: string;
  icon: React.ReactNode;
  defaultUrl: string;
  localUrl?: string;
  description: string;
  onBack: () => void;
}

export const EmbeddedAppViewer: React.FC<EmbeddedAppProps> = ({
  title,
  badge,
  category,
  categoryColor,
  icon,
  defaultUrl,
  localUrl,
  description,
  onBack,
}) => {
  const [device, setDevice] = useState<'full' | 'laptop' | 'tablet' | 'mobile'>('full');
  const [useLocal, setUseLocal] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const activeUrl = useLocal && localUrl ? localUrl : defaultUrl;

  const handleReload = () => {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenExternal = () => {
    if (typeof window !== 'undefined' && (window as any).suite?.openExternal) {
      (window as any).suite.openExternal(activeUrl);
    } else {
      window.open(activeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getContainerWidth = () => {
    switch (device) {
      case 'laptop':
        return 'max-w-5xl mx-auto shadow-2xl rounded-2xl border border-slate-300';
      case 'tablet':
        return 'max-w-2xl mx-auto shadow-2xl rounded-2xl border border-slate-300';
      case 'mobile':
        return 'max-w-[400px] mx-auto shadow-2xl rounded-[32px] border-4 border-slate-800';
      case 'full':
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-[calc(100vh-5rem)]">
      {/* Subheader Ejecutivo de Navegación y Pruebas */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Left: Volver + Nombre de la App */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-300 cursor-pointer"
            title="Volver al Centro de Control de la Suite"
          >
            <ArrowLeft className="w-4 h-4 text-mc-azul" />
            <span className="font-spartan">Hub Central</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200" />

          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-spartan font-bold uppercase tracking-wider text-slate-900">
              {title}
            </span>
            <span
              className={`text-[10px] font-spartan font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${categoryColor}`}
            >
              {badge}
            </span>
          </div>
        </div>

        {/* Center: Selector Responsivo (Prueba Multi-dispositivo) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setDevice('full')}
            className={`p-1.5 rounded-md text-xs font-medium transition-all ${
              device === 'full' ? 'bg-white shadow-xs text-mc-azul font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Pantalla Completa Fluida"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('laptop')}
            className={`p-1.5 rounded-md text-xs font-medium transition-all ${
              device === 'laptop' ? 'bg-white shadow-xs text-mc-azul font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Vista Laptop (1024px)"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-md text-xs font-medium transition-all ${
              device === 'tablet' ? 'bg-white shadow-xs text-mc-azul font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Vista Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-md text-xs font-medium transition-all ${
              device === 'mobile' ? 'bg-white shadow-xs text-mc-azul font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Vista Móvil Ejecutivo (390px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Origen (Cloud/Local) + Recarga + Abrir Externo */}
        <div className="flex items-center gap-2">
          {localUrl && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => { setUseLocal(false); handleReload(); }}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  !useLocal ? 'bg-mc-azul text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3 h-3 inline mr-1" />
                Cloud
              </button>
              <button
                onClick={() => { setUseLocal(true); handleReload(); }}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  useLocal ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3 h-3 inline mr-1" />
                Local
              </button>
            </div>
          )}

          <button
            onClick={handleReload}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200 cursor-pointer"
            title="Recargar página embebida"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-mc-azul' : ''}`} />
          </button>

          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mc-azul/10 hover:bg-mc-azul/20 text-mc-azul font-spartan text-xs font-bold transition-colors cursor-pointer"
            title="Abrir en navegador predeterminado del sistema"
          >
            <span>Navegador</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame de visualización */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center items-center overflow-auto">
        <div className={`w-full flex-1 flex flex-col overflow-hidden transition-all duration-300 ${getContainerWidth()}`}>
          {loading && (
            <div className="w-full py-4 text-center text-xs font-spartan text-slate-500 bg-white border-b border-slate-100 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mc-azul animate-ping" />
              <span>Conectando e integrando con {title} ({activeUrl})...</span>
            </div>
          )}
          <iframe
            key={iframeKey}
            src={activeUrl}
            title={title}
            className="w-full flex-1 border-0 bg-white rounded-inherit min-h-[700px]"
            onLoad={() => setLoading(false)}
            allow="camera; microphone; clipboard-read; clipboard-write; geolocation"
          />
        </div>
      </div>
    </div>
  );
};
