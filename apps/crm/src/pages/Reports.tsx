import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, DollarSign, Target, Users, Clock, Award,
  Download, Filter, ArrowRight, Percent, BarChart3,
} from "lucide-react";
import { WhatsAppStatsCard } from "@/components/reports/WhatsAppStatsCard";
import { AskCrmPanel } from "@/components/reports/AskCrmPanel";
import { format, subMonths, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { useDashboardData } from "@/hooks/useDashboard";
import { ListSkeleton } from "@/components/skeletons";
import { exportInteractionsExcel } from "@/lib/excelExport";
import { FileSpreadsheet } from "lucide-react";
import { CHART_COLORS, BRAND } from "@/lib/constants";
import {
  getPeriodDates,
  calculatePeriodKPIs,
  filterByPeriodStart,
  getLossReasons,
  getSalesByProduct,
  getSalesByProvince,
  getResultDistribution,
  getAvgSalesCycle,
  getWhatsAppStats,
  type Period,
} from "@/lib/businessLogic";
import type { Interaction } from "@/lib/types";

export default function Reports() {
  const [period, setPeriod] = useState<Period>("mes");
  const { data, isLoading } = useDashboardData();
  const interactions = data?.interactions ?? [];
  const clients = data?.clients ?? [];

  if (isLoading) return <ListSkeleton />;

  const { start: periodStart, label: periodLabel } = getPeriodDates(period);
  const periodInts = filterByPeriodStart(interactions, periodStart);
  const kpis = calculatePeriodKPIs(periodInts);
  const avgCycle = getAvgSalesCycle(periodInts);

  // Monthly trend (last 6 months)
  const now = new Date();
  const trendData = Array.from({ length: 6 }).map((_, i) => {
    const monthStart = startOfMonth(subMonths(now, 5 - i));
    const monthEnd = startOfMonth(subMonths(now, 4 - i));
    const monthInts = interactions.filter((x: any) => {
      const d = new Date(x.interaction_date);
      return d >= monthStart && d < monthEnd;
    });
    const v = monthInts.filter((x: any) => x.result === "venta");
    const p = monthInts.filter((x: any) => x.result === "presupuesto");
    return {
      month: format(monthStart, "MMM", { locale: es }),
      ventas: v.reduce((s: number, x: any) => s + (Number(x.total_amount) || 0), 0),
      presupuestos: p.reduce((s: number, x: any) => s + (Number(x.total_amount) || 0), 0),
      cantidad: v.length,
    };
  });

  // Derived data from businessLogic
  const funnelData = [
    { stage: "Interacciones", count: kpis.totalInteracciones, color: CHART_COLORS[0] },
    { stage: "Presupuestos", count: kpis.cantidadPresupuestos, color: CHART_COLORS[1] },
    { stage: "Ventas", count: kpis.cantidadVentas, color: CHART_COLORS[2] },
  ];
  const resultData = getResultDistribution(periodInts);
  const topProducts = getSalesByProduct(periodInts);
  const provinceData = getSalesByProvince(periodInts, clients);
  const lossData = getLossReasons(periodInts);
  const waStats = getWhatsAppStats(periodInts);

  // Export to PDF
  const handleExportPDF = () => {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Reportes — MejoraCRM</title>
<style>
  body{font-family:Arial,sans-serif;padding:32px;color:#1a1a1a;max-width:900px;margin:0 auto}
  h1{color:${BRAND.primary};font-size:20px;margin-bottom:4px}
  p.sub{color:#656565;font-size:12px;margin-bottom:24px}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
  .kpi{background:#f9f9f9;border-radius:8px;padding:16px;text-align:center}
  .kpi .value{font-size:24px;font-weight:bold;color:${BRAND.primary}}
  .kpi .label{font-size:11px;color:#656565;margin-top:4px}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px}
  th{background:${BRAND.primary};color:#fff;padding:8px;text-align:left}
  td{padding:6px 8px;border-bottom:1px solid #e5e5e5}
  .section{margin-bottom:32px}
  .section h2{font-size:14px;color:${BRAND.primary};margin-bottom:12px;border-bottom:2px solid ${BRAND.primary};padding-bottom:4px}
  @media print{body{padding:0}}
</style></head><body>
<h1>Reportes — MejoraCRM</h1>
<p class="sub">${periodLabel} · Exportado: ${new Date().toLocaleDateString("es-AR")}</p>
<div class="kpi-grid">
  <div class="kpi"><div class="value">$${kpis.ventasLogradas.toLocaleString()}</div><div class="label">Ventas logradas</div></div>
  <div class="kpi"><div class="value">$${kpis.ventasEnCurso.toLocaleString()}</div><div class="label">Ventas en curso</div></div>
  <div class="kpi"><div class="value">${kpis.winRate}%</div><div class="label">Win rate</div></div>
  <div class="kpi"><div class="value">${avgCycle}d</div><div class="label">Ciclo promedio</div></div>
</div>
<div class="section"><h2>Funnel de ventas</h2>
<table><thead><tr><th>Etapa</th><th>Cantidad</th><th>Tasa</th></tr></thead><tbody>
<tr><td>Interacciones totales</td><td>${kpis.totalInteracciones}</td><td>100%</td></tr>
<tr><td>Presupuestos enviados</td><td>${kpis.cantidadPresupuestos}</td><td>${kpis.totalInteracciones > 0 ? Math.round((kpis.cantidadPresupuestos / kpis.totalInteracciones) * 100) : 0}%</td></tr>
<tr><td>Ventas cerradas</td><td>${kpis.cantidadVentas}</td><td>${kpis.cantidadPresupuestos > 0 ? kpis.tasaConversion : 0}%</td></tr>
</tbody></table></div>
${topProducts.length > 0 ? `<div class="section"><h2>Top productos</h2><table><thead><tr><th>Producto</th><th>Revenue</th></tr></thead><tbody>${topProducts.map((p) => `<tr><td>${p.name}</td><td>$${p.value.toLocaleString()}</td></tr>`).join("")}</tbody></table></div>` : ""}
${provinceData.length > 0 ? `<div class="section"><h2>Ventas por provincia</h2><table><thead><tr><th>Provincia</th><th>Revenue</th></tr></thead><tbody>${provinceData.map((p) => `<tr><td>${p.name}</td><td>$${p.value.toLocaleString()}</td></tr>`).join("")}</tbody></table></div>` : ""}
${lossData.length > 0 ? `<div class="section"><h2>Motivos de pérdida</h2><table><thead><tr><th>Motivo</th><th>Cantidad</th></tr></thead><tbody>${lossData.map((l) => `<tr><td>${l.name}</td><td>${l.value}</td></tr>`).join("")}</tbody></table></div>` : ""}
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) { w.onload = () => { w.print(); }; };
  };

  const kpiCards = [
    { label: "Ventas logradas", value: `$${kpis.ventasLogradas.toLocaleString()}`, sub: `${kpis.cantidadVentas} ventas`, icon: DollarSign, color: "text-success", bg: "bg-success/10" },
    { label: "Ventas en curso", value: `$${kpis.ventasEnCurso.toLocaleString()}`, sub: `${kpis.cantidadPresupuestos} presupuestos`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Win rate", value: `${kpis.winRate}%`, sub: `${kpis.cantidadVentas} de ${kpis.cantidadVentas + kpis.cantidadNoInteresado}`, icon: Target, color: "text-accent", bg: "bg-accent/20" },
    { label: "Ciclo promedio", value: avgCycle > 0 ? `${avgCycle} días` : "N/A", sub: "presupuesto → venta", icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
    { label: "Éxito de ventas", value: `${kpis.tasaConversion}%`, sub: `${kpis.cantidadVentas}/${kpis.cantidadPresupuestos} presupuestos`, icon: Percent, color: "text-warning", bg: "bg-warning/10" },
    { label: "Revenue perdido", value: `$${kpis.ventasNoConcretadas.toLocaleString()}`, sub: `${kpis.cantidadNoInteresado} rechazos`, icon: Award, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Reportes</h1>
          <p className="text-sm text-muted-foreground">Análisis de {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-36 h-9">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="semestre">Semestre</SelectItem>
              <SelectItem value="año">Año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => exportInteractionsExcel(interactions)}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((kpi, i) => (
          <Card key={kpi.label} className={`animate-slide-up stagger-${i + 1} opacity-0 border-border/50`}>
            <CardContent className="p-4 text-center">
              <div className={`mx-auto w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Funnel de ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelData.map((item, i) => {
              const maxCount = funnelData[0].count || 1;
              const pct = Math.round((item.count / maxCount) * 100);
              const convRate = i > 0 && funnelData[i - 1].count > 0
                ? Math.round((item.count / funnelData[i - 1].count) * 100) : null;
              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums">{item.count}</span>
                      {convRate !== null && <Badge variant="outline" className="text-[10px]">{convRate}%</Badge>}
                    </div>
                  </div>
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                  {i < funnelData.length - 1 && <div className="flex justify-center"><ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" /></div>}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Tendencia mensual</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <RTooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Area type="monotone" dataKey="ventas" stackId="1" stroke="hsl(142,60%,40%)" fill="hsl(142,60%,40%)" fillOpacity={0.3} name="Ventas" />
                <Area type="monotone" dataKey="presupuestos" stackId="2" stroke={BRAND.secondary} fill={BRAND.secondary} fillOpacity={0.3} name="Presupuestos" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribución de resultados</CardTitle></CardHeader>
          <CardContent className="h-56">
            {resultData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={resultData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={30} strokeWidth={2}>
                    {resultData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <RTooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin datos</div>}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top productos</CardTitle></CardHeader>
          <CardContent className="h-56">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={10} />
                  <YAxis type="category" dataKey="name" width={80} fontSize={10} tickLine={false} />
                  <RTooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  <Bar dataKey="value" fill={BRAND.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin ventas con productos</div>}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Motivos de pérdida</CardTitle></CardHeader>
          <CardContent className="h-56">
            {lossData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={lossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={30} strokeWidth={2}>
                    {lossData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <RTooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin rechazos en el período</div>}
          </CardContent>
        </Card>
      </div>

      {/* Preguntale a tu CRM */}
      <AskCrmPanel
        periodLabel={periodLabel}
        kpis={kpis}
        avgCycle={avgCycle}
        resultData={resultData}
        topProducts={topProducts}
        waStats={waStats}
      />

      {/* WhatsApp */}
      <WhatsAppStatsCard stats={waStats} />

      {/* Province breakdown */}
      {provinceData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Revenue por provincia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {provinceData.map((p) => (
                <div key={p.name} className="p-3 rounded-lg bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground">{p.name}</p>
                  <p className="text-sm font-bold">${p.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
