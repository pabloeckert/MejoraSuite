import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, DollarSign, FileText, Clock, Users, Trophy, AlertCircle,
  UserPlus, UserCheck, BarChart3, UserX, Activity,
} from "lucide-react";
import { isBefore, differenceInDays, differenceInHours, format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { RESULT_LABELS, CHART_COLORS, AGING_THRESHOLDS } from "@/lib/constants";
import {
  getPeriodDates,
  calculatePeriodKPIs,
  calculateTrend,
  filterByPeriodStart,
  getOverdueInteractions,
  getSellerRanking,
  getLossReasons,
  getSalesByProduct,
  getSalesByProvince,
  getSalesBySegment,
  getResultDistribution,
  getAvgSalesCycle,
  type Period,
} from "@/lib/businessLogic";
import type { Interaction, Client, Profile, TargetMap } from "@/lib/types";

interface OwnerViewV2Props {
  interactions: Interaction[];
  clients: Client[];
  profiles: Profile[];
  targetMap: TargetMap;
  navigate: (path: string) => void;
}

const PERIOD_KEY = "dashboard_period";

export function OwnerViewV2({ interactions, clients, profiles, targetMap, navigate }: OwnerViewV2Props) {
  const [period, setPeriod] = useState<Period>(
    () => (localStorage.getItem(PERIOD_KEY) as Period) ?? "mes"
  );
  const handlePeriodChange = useCallback((p: Period) => {
    localStorage.setItem(PERIOD_KEY, p);
    setPeriod(p);
  }, []);
  const profileMap = Object.fromEntries(profiles.map((p) => [p.user_id, p.full_name || "Sin nombre"]));

  const { start: periodStart, prevStart: prevPeriodStart, label: periodLabel } = getPeriodDates(period);
  const periodInts = filterByPeriodStart(interactions, periodStart);
  const prevInts = filterByPeriodStart(interactions, prevPeriodStart).filter(
    (i) => new Date(i.interaction_date) < periodStart
  );

  const kpis = calculatePeriodKPIs(periodInts);
  const prevKpis = calculatePeriodKPIs(prevInts);

  // Trends
  const trendVentas = calculateTrend(kpis.ventasLogradas, prevKpis.ventasLogradas);
  const trendPresup = calculateTrend(kpis.cantidadPresupuestos, prevKpis.cantidadPresupuestos);
  const trendPerdido = calculateTrend(kpis.ventasNoConcretadas, prevKpis.ventasNoConcretadas);

  // Derived data
  const overdue = getOverdueInteractions(interactions);
  const ranking = getSellerRanking(periodInts, profileMap);
  const avgDiasCierre = getAvgSalesCycle(periodInts);
  const lossData = getLossReasons(periodInts);
  const productData = getSalesByProduct(periodInts);
  const zoneData = getSalesByProvince(periodInts, clients);
  const rubroData = getSalesBySegment(periodInts, clients);
  const resultData = getResultDistribution(periodInts);

  // Client stats
  const contactosNuevos = clients.filter((c) => c.created_at && new Date(c.created_at) >= periodStart).length;
  const clientesAtendidos = new Set(periodInts.map((i) => i.client_id)).size;
  const clientesConActividad = new Set(interactions.filter((i) => new Date(i.interaction_date) >= periodStart).map((i) => i.client_id));
  const contactosSinSeguimiento = clients.filter((c) => !clientesConActividad.has(c.id)).length;

  // Clientes activos sin ninguna interacción en los últimos 30 días
  const inactivityCutoff = subDays(new Date(), 30);
  const clientLastActivity = new Map<string, Date>();
  interactions.forEach((i) => {
    const d = new Date(i.interaction_date);
    const prev = clientLastActivity.get(i.client_id);
    if (!prev || d > prev) clientLastActivity.set(i.client_id, d);
  });
  const clientesInactivosCount = clients.filter(
    (c) => c.status === "activo" &&
      (!clientLastActivity.has(c.id) || clientLastActivity.get(c.id)! < inactivityCutoff)
  ).length;

  // Progreso hacia cuota — retorna null si el vendedor no tiene target asignado
  function progressFor(uid: string, ingresos: number) {
    const target = targetMap[uid] ?? null;
    if (!target) return null;
    const pct = Math.min(Math.round((ingresos / target) * 100), 100);
    const over = ingresos >= target;
    return {
      pct,
      target,
      barClass: over ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-destructive",
      bgClass: over ? "bg-success/10" : pct >= 60 ? "bg-warning/10" : "bg-destructive/10",
      label: over
        ? `¡Meta! $${ingresos.toLocaleString()} / $${target.toLocaleString()}`
        : `$${ingresos.toLocaleString()} de $${target.toLocaleString()} (${pct}%)`,
    };
  }

  // Trend badge helper
  const TrendBadge = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const sign = value > 0 ? "+" : "";
    return <span className={`text-[10px] font-semibold ${value > 0 ? "text-success" : "text-destructive"}`}>{sign}{value}%</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Vista general · Dueño</h1>
          <p className="text-sm text-muted-foreground">Resumen de {periodLabel}</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["hoy", "semana", "mes", "trimestre", "semestre", "año"] as Period[]).map((p) => (
            <Button key={p} variant={period === p ? "default" : "outline"} size="sm" className="h-8 text-xs px-3" onClick={() => handlePeriodChange(p)}>
              {p === "hoy" ? "Hoy" : p === "semana" ? "Semana" : p === "mes" ? "Mes" : p === "trimestre" ? "Trimestre" : p === "semestre" ? "Semestre" : "Año"}
            </Button>
          ))}
        </div>
      </div>

      {/* BLOQUE 1: Resultados Directos */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Resultados directos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="animate-slide-up stagger-1 opacity-0 hover:shadow-md transition-all duration-200 cursor-pointer border-border/50" onClick={() => navigate("/interactions")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ventas logradas</p>
                  <p className="text-2xl font-bold tracking-tight text-success">${kpis.ventasLogradas.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{kpis.cantidadVentas} ventas</p>
                    <TrendBadge value={trendVentas.percent} />
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-success/10"><DollarSign className="h-5 w-5 text-success" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up stagger-2 opacity-0 hover:shadow-md transition-all duration-200 cursor-pointer border-border/50" onClick={() => navigate("/interactions")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ventas en curso</p>
                  <p className="text-2xl font-bold tracking-tight text-warning">${kpis.ventasEnCurso.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{kpis.cantidadPresupuestos} presupuestos</p>
                    <TrendBadge value={trendPresup.percent} />
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-warning/10"><FileText className="h-5 w-5 text-warning" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up stagger-3 opacity-0 hover:shadow-md transition-all duration-200 cursor-pointer border-border/50" onClick={() => navigate("/interactions")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ventas no concretadas</p>
                  <p className="text-2xl font-bold tracking-tight text-destructive">${kpis.ventasNoConcretadas.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{kpis.cantidadNoInteresado} rechazos</p>
                    <TrendBadge value={trendPerdido.percent} />
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-destructive/10"><AlertCircle className="h-5 w-5 text-destructive" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up stagger-4 opacity-0 hover:shadow-md transition-all duration-200 cursor-pointer border-border/50" onClick={() => navigate("/interactions")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Éxito de ventas</p>
                  <p className="text-2xl font-bold tracking-tight text-accent">{kpis.tasaConversion}%</p>
                  <p className="text-xs text-muted-foreground">{kpis.cantidadVentas} de {kpis.cantidadPresupuestos}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-accent/20"><TrendingUp className="h-5 w-5 text-accent" /></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BLOQUE 2: Pipeline activo */}
      {(() => {
        const now = new Date();
        const OPEN = ["presupuesto", "seguimiento", "sin_respuesta"] as const;
        const stages = OPEN.map((result) => {
          const items = interactions.filter((i) => i.result === result);
          const amount = items.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
          const avgAging = items.length
            ? Math.round(items.reduce((s, i) => s + differenceInDays(new Date(), new Date(i.interaction_date)), 0) / items.length)
            : 0;
          const riskyItems = items.filter((i) => differenceInHours(now, new Date(i.interaction_date)) >= AGING_THRESHOLDS.AMBER_HOURS);
          const riskAmount = riskyItems.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
          return { result, items, amount, avgAging, riskCount: riskyItems.length, riskAmount };
        });
        const maxAmount = Math.max(...stages.map((s) => s.amount), 1);
        const totalPipeline = stages.reduce((s, st) => s + st.amount, 0);
        const totalRisk = stages.reduce((s, st) => s + st.riskAmount, 0);
        const forecast = kpis.tasaConversion > 0
          ? Math.round(stages[0].amount * (kpis.tasaConversion / 100))
          : null;

        const STAGE_CFG = {
          presupuesto:   { label: "Presupuestos",   bar: "bg-amber-400",    text: "text-amber-700",  bg: "bg-amber-50",  Icon: FileText   },
          seguimiento:   { label: "En seguimiento", bar: "bg-primary",      text: "text-primary",    bg: "bg-primary/5", Icon: Clock      },
          sin_respuesta: { label: "Sin respuesta",  bar: "bg-muted-foreground/40", text: "text-muted-foreground", bg: "bg-muted/20", Icon: AlertCircle },
        } as const;

        return (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Pipeline activo
            </h2>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                {stages.map(({ result, items, amount, avgAging, riskCount, riskAmount }) => {
                  const cfg = STAGE_CFG[result];
                  const pct = maxAmount > 0 ? Math.round((amount / maxAmount) * 100) : 0;
                  return (
                    <div key={result} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded-md ${cfg.bg}`}>
                            <cfg.Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
                          </div>
                          <span className="text-sm font-medium">{cfg.label}</span>
                          <Badge variant="secondary" className="text-xs tabular-nums">{items.length}</Badge>
                          {avgAging > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              ~{avgAging}d promedio
                            </span>
                          )}
                          {riskCount > 0 && (
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                              {riskCount} en riesgo
                            </Badge>
                          )}
                        </div>
                        <span className={`text-sm font-bold tabular-nums shrink-0 ${cfg.text}`}>
                          {amount > 0 ? `$${amount.toLocaleString()}` : "—"}
                        </span>
                      </div>
                      <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {riskAmount > 0 && (
                        <p className="text-[10px] text-destructive">
                          ${riskAmount.toLocaleString()} sin actividad hace {AGING_THRESHOLDS.AMBER_HOURS}h+ — en riesgo de enfriarse
                        </p>
                      )}
                    </div>
                  );
                })}

                <div className="border-t border-border/50 pt-3 flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Pipeline total</p>
                    <p className="text-lg font-bold">${totalPipeline.toLocaleString()}</p>
                  </div>
                  {totalRisk > 0 && (
                    <div className="space-y-0.5 text-right">
                      <p className="text-xs text-muted-foreground">Total en riesgo</p>
                      <p className="text-lg font-bold text-destructive">${totalRisk.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Sin actividad hace {AGING_THRESHOLDS.AMBER_HOURS}h+</p>
                    </div>
                  )}
                  {forecast !== null && forecast > 0 && (
                    <div className="space-y-0.5 text-right">
                      <p className="text-xs text-muted-foreground">Forecast estimado</p>
                      <p className="text-lg font-bold text-success">${forecast.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Presupuestos × {kpis.tasaConversion}% conversión</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* BLOQUE 4: Gestión Comercial + Rendimiento del Equipo */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Gestión comercial y rendimiento del equipo
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card className="border-border/50 hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><Clock className="h-4 w-4 text-destructive" /></div>
                <div><p className="text-lg font-bold">{overdue.length}</p><p className="text-xs text-muted-foreground">Seg. vencidos</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><UserPlus className="h-4 w-4 text-primary" /></div>
                <div><p className="text-lg font-bold">{contactosNuevos}</p><p className="text-xs text-muted-foreground">Contactos nuevos</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10"><UserCheck className="h-4 w-4 text-success" /></div>
                <div><p className="text-lg font-bold">{clientesAtendidos}</p><p className="text-xs text-muted-foreground">Contactos atendidos</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20"><Users className="h-4 w-4 text-accent" /></div>
                <div><p className="text-lg font-bold">{contactosSinSeguimiento}</p><p className="text-xs text-muted-foreground">Sin seguimiento</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className={`border-border/50 hover:shadow-sm transition-shadow ${clientesInactivosCount > 0 ? "border-l-2 border-l-amber-400" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10"><UserX className="h-4 w-4 text-amber-600" /></div>
                <div><p className="text-lg font-bold">{clientesInactivosCount}</p><p className="text-xs text-muted-foreground">Activos fríos 30d+</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent" /> Ranking de vendedores · {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin actividad en el período</p>
              ) : (
                <div className="space-y-2">
                  {ranking.map((r, i) => {
                    const prog = progressFor(r.uid, r.ingresos);
                    return (
                      <div key={r.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Badge variant={i === 0 ? "default" : "secondary"} className="shrink-0 w-6 h-6 p-0 justify-center">{i + 1}</Badge>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.ventas} ventas · {r.presup} presupuestos · {r.segs} seguimientos</p>
                            {prog && (
                              <div className="mt-1.5">
                                <p className="text-[10px] text-muted-foreground mb-0.5">{prog.label}</p>
                                <div className={`h-1.5 rounded-full ${prog.bgClass}`}>
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${prog.barClass}`}
                                    style={{ width: `${prog.pct}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-bold tabular-nums ml-3">${r.ingresos.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Éxito de ventas</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-accent">{kpis.tasaConversion}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpis.cantidadVentas} ventas de {kpis.cantidadPresupuestos} presupuestos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Tiempo hasta cerrar</CardTitle></CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-primary">{avgDiasCierre > 0 ? avgDiasCierre : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{avgDiasCierre > 0 ? "días promedio" : "Sin datos de ciclo"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {overdue.length > 0 && (
          <Card className="border-border/50 mt-6">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-destructive" /> Seguimientos vencidos
              </CardTitle>
              <Badge variant="destructive" className="text-xs">{overdue.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {overdue.slice(0, 8).map((i) => (
                  <div key={i.id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 hover:bg-destructive/10 cursor-pointer" onClick={() => navigate("/interactions")}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.clients?.name || "Cliente"}</p>
                      <p className="text-xs text-muted-foreground truncate">{profileMap[i.user_id] || ""} · {i.next_step || "Pendiente"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30 shrink-0">{differenceInDays(new Date(), new Date(i.follow_up_date!))}d</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* BLOQUE 3: Análisis y Estrategia */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Análisis y estrategia
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor promedio de venta</p>
              <p className="text-xl font-bold mt-1">${kpis.valorPromedioVenta.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total ventas en período</p>
              <p className="text-xl font-bold mt-1">{kpis.cantidadVentas}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total interacciones</p>
              <p className="text-xl font-bold mt-1">{kpis.totalInteracciones}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Motivos de pérdida</CardTitle></CardHeader>
            <CardContent className="h-64">
              {lossData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={lossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36} strokeWidth={2}>{lossData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><RTooltip /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin rechazos en el período</div>}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Ventas por producto</CardTitle></CardHeader>
            <CardContent className="h-64">
              {productData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><BarChart data={productData} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(v) => `$${Number(v).toLocaleString()}`} fontSize={11} /><YAxis type="category" dataKey="name" width={100} fontSize={11} tickLine={false} /><RTooltip formatter={(v) => `$${Number(v).toLocaleString()}`} /><Bar dataKey="value" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin ventas con productos</div>}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Ventas por zona</CardTitle></CardHeader>
            <CardContent className="h-64">
              {zoneData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><BarChart data={zoneData} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(v) => `$${Number(v).toLocaleString()}`} fontSize={11} /><YAxis type="category" dataKey="name" width={100} fontSize={11} tickLine={false} /><RTooltip formatter={(v) => `$${Number(v).toLocaleString()}`} /><Bar dataKey="value" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin ventas por zona</div>}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribución por rubro</CardTitle></CardHeader>
            <CardContent className="h-64">
              {rubroData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={rubroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36} strokeWidth={2}>{rubroData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><RTooltip formatter={(v) => `$${Number(v).toLocaleString()}`} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin ventas por rubro</div>}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 mt-6">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Distribución de resultados</CardTitle></CardHeader>
          <CardContent className="h-64">
            {resultData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={resultData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={36} strokeWidth={2}>
                    {resultData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <RTooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin datos en el período</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
