import React from 'react';
import {
  FileText,
  TrendingUp,
  Briefcase,
  Users2,
  Share2,
  Sparkles,
  MessageCircle,
  Globe,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { TelemetryData } from '../services/telemetryService';

interface LauncherMatrixProps {
  telemetry: TelemetryData;
  onNavigate?: (view: 'crm' | 'contactos' | 'sm' | 'wa') => void;
}

interface ModuleCard {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  targetUrl: string;
  isProtocol?: boolean;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  description: string;
  conversionImpact: string;
  statusText: string;
  statusOnline: boolean;
  actionText: string;
}

export const LauncherMatrix: React.FC<LauncherMatrixProps> = ({ telemetry, onNavigate }) => {
  const modules: ModuleCard[] = [
    {
      id: 'diagnostico',
      category: 'Hook Pyme',
      categoryColor: 'bg-amber-500/10 text-mc-amarillo border-amber-500/30',
      title: 'MejoraDiagnostico',
      targetUrl: 'https://diagnostico.mejoraok.com',
      icon: <FileText className="w-6 h-6 text-mc-amarillo" />,
      badge: 'Boca de Captura Principal',
      badgeColor: 'bg-mc-amarillo/15 text-mc-amarillo border-mc-amarillo/30',
      description: 'Test de diagnóstico empresarial en 8 dimensiones. Scoring automático, informe PDF y derivación directa a WhatsApp.',
      conversionImpact: 'Captura Leads Fríos — Directo a contactos-api',
      statusText: 'Vercel — En Producción',
      statusOnline: true,
      actionText: 'Abrir Diagnóstico',
    },
    {
      id: 'decisiones',
      category: 'Hook Alta Dirección',
      categoryColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      title: 'MejoraDecisiones',
      targetUrl: 'https://pabloeckert.github.io/MejoraDecisiones/',
      icon: <TrendingUp className="w-6 h-6 text-cyan-400" />,
      badge: 'Tablero Nash & Poder',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      description: 'Simulador macro y teoría de juegos 2x2. Grafo interactivo de actores e indicadores BCRA/INDEC en vivo con CTA al Diagnóstico 4D.',
      conversionImpact: 'Conversión C-Level — Derivación a Consultoría',
      statusText: 'GitHub Pages — En Línea',
      statusOnline: true,
      actionText: 'Abrir Tablero Nash',
    },
    {
      id: 'crm',
      category: 'Ventas & Deals',
      categoryColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      title: 'MejoraCRM',
      targetUrl: 'internal://crm',
      icon: <Briefcase className="w-6 h-6 text-emerald-400" />,
      badge: 'Ventas & Pipeline Local',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      description: 'Gestión de pipeline de ventas, cotizaciones, Deals en SQLite y fuente comercial soberana sin dependencia cloud.',
      conversionImpact: 'Maduración & Cierre — deals locales / SQLite',
      statusText: 'Integrado · SQLite Local',
      statusOnline: true,
      actionText: 'Abrir CRM Local',
    },
    {
      id: 'app',
      category: 'Comunidad & Retención',
      categoryColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      title: 'MejoraApp',
      targetUrl: 'https://app.mejoraok.com',
      icon: <Users2 className="w-6 h-6 text-blue-400" />,
      badge: 'Portal Clientes PWA',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      description: 'Portal privado para líderes y miembros de comunidad. Muro interactivo, contenidos exclusivos y test Business Mirror gamer.',
      conversionImpact: 'LTV & Fidelización — Sync usuarios a contactos-api',
      statusText: 'Vercel — PWA Activa',
      statusOnline: true,
      actionText: 'Ingresar a MejoraApp',
    },
    {
      id: 'sm',
      category: 'Contenidos B2B',
      categoryColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      title: 'MejoraSM',
      targetUrl: 'internal://sm',
      icon: <Share2 className="w-6 h-6 text-indigo-400" />,
      badge: 'Social Media & SQLite',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      description: 'Generación con IA, autopublicación multicanal (LinkedIn, IG, FB), propuestas y calendario editorial conectado a SQLite.',
      conversionImpact: 'Tracción Social — Propuestas y Contenidos locales',
      statusText: 'Integrado · SQLite Local',
      statusOnline: true,
      actionText: 'Abrir Social Media Local',
    },
    {
      id: 'contactos',
      category: 'Base & Limpieza',
      categoryColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      title: 'MejoraContactos',
      targetUrl: 'internal://contactos',
      icon: <Sparkles className="w-6 h-6 text-teal-400" />,
      badge: 'Truth Engine de Identidad',
      badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      description: 'Deduplicación algorítmica por clusters de similitud, resolución de personas y base unificada en SQLite local.',
      conversionImpact: 'Calidad del Dato — SQLite Persona unificada',
      statusText: 'Integrado · SQLite Local',
      statusOnline: true,
      actionText: 'Abrir Contactos Local',
    },
    {
      id: 'ws',
      category: 'Outreach WhatsApp',
      categoryColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      title: 'MejoraWS Local',
      targetUrl: 'internal://wa',
      isProtocol: false,
      icon: <MessageCircle className="w-6 h-6 text-emerald-400" />,
      badge: 'Outreach Baileys SQLite',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      description: 'Motor de mensajería directa y panel de control de sesiones Baileys. Gestión de carpetas y contactos relacionales en SQLite.',
      conversionImpact: 'Contacto Directo — Sincronización SQLite nativa',
      statusText: telemetry.wsLocalOnline ? 'wa-engine :4180 Activo' : 'wa-engine Local SQLite',
      statusOnline: true,
      actionText: 'Abrir WhatsApp Local',
    },
    {
      id: 'ok',
      category: 'Portal Institucional',
      categoryColor: 'bg-slate-400/10 text-slate-300 border-slate-500/30',
      title: 'Mejoraok',
      targetUrl: 'https://mejoraok.com',
      icon: <Globe className="w-6 h-6 text-mc-amarillo" />,
      badge: 'Front Door Institucional',
      badgeColor: 'bg-white/10 text-white border-white/20',
      description: 'Sitio institucional oficial de Mejora Continua. Manifiesto, oferta de servicios de consultoría y derivador estratégico.',
      conversionImpact: 'Autoridad & Tráfico — Bifurcador a Diagnóstico',
      statusText: 'Hostinger — Dominio Raíz',
      statusOnline: true,
      actionText: 'Visitar mejoraok.com',
    },
  ];

  const handleLaunch = (mod: ModuleCard) => {
    if (mod.id === 'crm') {
      onNavigate?.('crm');
      return;
    }
    if (mod.id === 'contactos') {
      onNavigate?.('contactos');
      return;
    }
    if (mod.id === 'sm') {
      onNavigate?.('sm');
      return;
    }
    if (mod.id === 'ws') {
      onNavigate?.('wa');
      return;
    }
    if (mod.isProtocol) {
      window.location.href = mod.targetUrl;
      setTimeout(() => {
        console.info('[MejoraSuite] Intentando abrir protocolo mejoraws://');
      }, 500);
    } else {
      window.open(mod.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-spartan uppercase">
            Matriz de Lanzadores y Ganchos de Conversión
          </h2>
          <p className="text-sm text-slate-400">
            Ecosistema articulado horizontalmente: acceso directo a los módulos operativos locales y remotos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between relative group"
          >
            <div>
              {/* Category & Status Row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`text-[10px] font-spartan font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${mod.categoryColor}`}
                >
                  {mod.category}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      mod.statusOnline ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {mod.statusText}
                </span>
              </div>

              {/* Title & Badge */}
              <div className="flex items-start gap-3 mb-2.5">
                <div className="p-2.5 rounded-xl bg-mc-azul-surface border border-white/10 group-hover:border-mc-amarillo/30 transition-colors">
                  {mod.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide group-hover:text-mc-amarillo transition-colors">
                    {mod.title}
                  </h3>
                  <span
                    className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded border ${mod.badgeColor}`}
                  >
                    {mod.badge}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {mod.description}
              </p>

              {/* Conversion Impact */}
              <div className="text-[11px] font-semibold text-mc-amarillo/90 bg-mc-amarillo/5 border border-mc-amarillo/15 rounded-lg px-2.5 py-1 mb-4">
                {mod.conversionImpact}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => handleLaunch(mod)}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-spartan text-xs font-bold uppercase tracking-wider bg-mc-azul-surface hover:bg-mc-amarillo hover:text-mc-slate text-slate-200 border border-white/15 hover:border-mc-amarillo transition-all duration-200 cursor-pointer shadow-sm group-hover:shadow"
            >
              <span>{mod.actionText}</span>
              {mod.id === 'crm' || mod.id === 'contactos' || mod.id === 'sm' ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : mod.isProtocol ? (
                <Radio className="w-3.5 h-3.5" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
