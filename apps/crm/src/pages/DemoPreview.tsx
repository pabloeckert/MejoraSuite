import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/dashboard/KPICard";
import { WhatsAppStatsCard } from "@/components/reports/WhatsAppStatsCard";
import { DollarSign, TrendingUp, Target, Users, X, Sparkles } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, Tooltip as RTooltip, ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import {
  calculatePeriodKPIs,
  getResultDistribution,
  getWhatsAppStats,
} from "@/lib/businessLogic";
import { DEMO_CLIENTS, DEMO_INTERACTIONS } from "@/demo/demoData";
import type { Interaction } from "@/lib/types";

/**
 * Vista de demostración aislada: renderiza directo desde datos ficticios,
 * sin pasar por Supabase ni por ningún hook real (useDashboardData,
 * useInteractions, etc.) — a propósito, para no arriesgar el DEMO_MODE real
 * (constante de build, no reactiva, ver CLAUDE.md) ni ninguna ruta de datos
 * en vivo. Pensada para mostrarle a alguien "cómo funcionaría" sin
 * necesitar clientes/ventas reales cargados.
 *
 * Suma unas pocas interacciones de WhatsApp ficticias (no viven en
 * demoData.ts, que alimenta el demo mode real) solo para que la tarjeta de
 * WhatsApp tenga algo que mostrar acá.
 */
const DEMO_WHATSAPP_INTERACTIONS = [
  { id: "wa1", client_id: "c1", user_id: "demo-seller-001", result: "seguimiento", medium: "whatsapp", followup_scenario: "independiente", total_amount: null, currency: "ARS", interaction_date: "2026-05-12", notes: 'Respondió por WhatsApp: "Sí, nos interesa avanzar"' },
  { id: "wa2", client_id: "c4", user_id: "demo-seller-001", result: "seguimiento", medium: "whatsapp", followup_scenario: "independiente", total_amount: null, currency: "ARS", interaction_date: "2026-05-13", notes: 'Respondió por WhatsApp: "Necesito la cotización actualizada"' },
  { id: "wa3", client_id: "c6", user_id: "demo-seller-001", result: "seguimiento", medium: "whatsapp", followup_scenario: "independiente", total_amount: null, currency: "ARS", interaction_date: "2026-05-15", notes: 'Respondió por WhatsApp: "Gracias, lo vemos la semana que viene"' },
];

const allDemoInteractions = [...DEMO_INTERACTIONS, ...DEMO_WHATSAPP_INTERACTIONS] as unknown as Interaction[];

export default function DemoPreview() {
  const kpis = calculatePeriodKPIs(allDemoInteractions);
  const resultData = getResultDistribution(allDemoInteractions);
  const waStats = getWhatsAppStats(allDemoInteractions);

  const kpiCards = [
    { label: "Ventas logradas", value: `$${kpis.ventasLogradas.toLocaleString()}`, sub: `${kpis.cantidadVentas} ventas`, icon: DollarSign, color: "text-success", bg: "bg-success/10" },
    { label: "Ventas en curso", value: `$${kpis.ventasEnCurso.toLocaleString()}`, sub: `${kpis.cantidadPresupuestos} presupuestos`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Win rate", value: `${kpis.winRate}%`, sub: `${kpis.cantidadVentas} de ${kpis.cantidadVentas + kpis.cantidadNoInteresado}`, icon: Target, color: "text-accent", bg: "bg-accent/20" },
    { label: "Clientes de ejemplo", value: `${DEMO_CLIENTS.length}`, sub: "en esta demostración", icon: Users, color: "text-muted-foreground", bg: "bg-muted" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-base font-bold">Estás viendo datos de ejemplo</h1>
            <p className="text-sm text-muted-foreground">
              Ninguno de estos clientes, ventas o mensajes es real — es solo para mostrar cómo funcionaría el CRM con WhatsApp conectado.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/"><X className="h-4 w-4 mr-1" /> Salir del modo demostración</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpiCards.map((kpi, i) => <KPICard key={kpi.label} {...kpi} index={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribución de resultados</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resultData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={30} strokeWidth={2}>
                  {resultData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <RTooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <WhatsAppStatsCard stats={waStats} />
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Clientes de ejemplo</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DEMO_CLIENTS.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.segment} · {c.province}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
