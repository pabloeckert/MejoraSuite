import { useMemo } from "react";
import { startOfMonth, subMonths, startOfWeek, startOfDay } from "date-fns";
import type { Interaction, Client, Profile } from "@/lib/types";

export type Period = "hoy" | "semana" | "mes" | "trimestre" | "semestre" | "año";

export interface PeriodKPIs {
  ventasLogradas: number;
  ventasEnCurso: number;
  ventasNoConcretadas: number;
  tasaConversion: number;
  winRate: number;
  cantidadVentas: number;
  cantidadPresupuestos: number;
  cantidadSeguimientos: number;
  cantidadNoInteresado: number;
  totalInteracciones: number;
  valorPromedioVenta: number;
}

export interface TrendData {
  value: number;
  percent: number;
}

export interface PeriodData {
  periodStart: Date;
  prevPeriodStart: Date;
  periodLabel: string;
  interactions: Interaction[];
  prevInteractions: Interaction[];
}

/**
 * Get the start date and label for a given period.
 */
export function getPeriodDates(period: Period, now: Date = new Date()): { start: Date; prevStart: Date; label: string } {
  switch (period) {
    case "hoy":
      return {
        start: startOfDay(now),
        prevStart: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        label: "Hoy",
      };
    case "semana":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        prevStart: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        label: "Últimos 7 días",
      };
    case "trimestre":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        prevStart: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        label: "Último trimestre",
      };
    case "semestre":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        prevStart: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        label: "Último semestre",
      };
    case "año":
      return {
        start: new Date(now.getFullYear(), 0, 1),
        prevStart: new Date(now.getFullYear() - 1, 0, 1),
        label: String(now.getFullYear()),
      };
    default: // "mes"
      return {
        start: startOfMonth(now),
        prevStart: startOfMonth(subMonths(now, 1)),
        label: startOfMonth(now).toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
      };
  }
}

/**
 * Calculate KPIs from a list of interactions.
 */
export function calculatePeriodKPIs(interactions: Interaction[]): PeriodKPIs {
  const ventas = interactions.filter((i) => i.result === "venta");
  const presupuestos = interactions.filter((i) => i.result === "presupuesto");
  const noInteresado = interactions.filter((i) => i.result === "no_interesado");
  const seguimientos = interactions.filter((i) => i.result === "seguimiento");

  const ventasLogradas = ventas.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const ventasEnCurso = presupuestos.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const ventasNoConcretadas = noInteresado.reduce((s, i) => s + (Number(i.estimated_loss) || 0), 0);

  const totalVentasPerdidas = noInteresado.length;
  const tasaConversion = presupuestos.length > 0 ? Math.round((ventas.length / presupuestos.length) * 100) : 0;
  const winRate = (ventas.length + totalVentasPerdidas) > 0
    ? Math.round((ventas.length / (ventas.length + totalVentasPerdidas)) * 100)
    : 0;

  return {
    ventasLogradas,
    ventasEnCurso,
    ventasNoConcretadas,
    tasaConversion,
    winRate,
    cantidadVentas: ventas.length,
    cantidadPresupuestos: presupuestos.length,
    cantidadSeguimientos: seguimientos.length,
    cantidadNoInteresado: noInteresado.length,
    totalInteracciones: interactions.length,
    valorPromedioVenta: ventas.length > 0 ? Math.round(ventasLogradas / ventas.length) : 0,
  };
}

/**
 * Calculate trend (percent change) between current and previous values.
 */
export function calculateTrend(current: number, previous: number): TrendData {
  if (previous > 0) {
    return { value: current - previous, percent: Math.round(((current - previous) / previous) * 100) };
  }
  return { value: current, percent: current > 0 ? 100 : 0 };
}

/**
 * Filter interactions by a period start date.
 */
export function filterByPeriodStart(interactions: Interaction[], start: Date): Interaction[] {
  return interactions.filter((i) => new Date(i.interaction_date) >= start);
}

/**
 * Get overdue follow-ups.
 */
export function getOverdueInteractions(interactions: Interaction[]): Interaction[] {
  const now = new Date();
  return interactions.filter((i) => i.follow_up_date && new Date(i.follow_up_date) < now);
}

/**
 * Get seller ranking from interactions.
 */
export function getSellerRanking(
  interactions: Interaction[],
  profileMap: Record<string, string>
): Array<{ uid: string; name: string; ventas: number; presup: number; segs: number; ingresos: number }> {
  const stats: Record<string, { ventas: number; presup: number; segs: number; ingresos: number }> = {};

  for (const i of interactions) {
    const key = i.user_id;
    if (!key) continue;
    if (!stats[key]) stats[key] = { ventas: 0, presup: 0, segs: 0, ingresos: 0 };

    if (i.result === "venta") {
      stats[key].ventas++;
      stats[key].ingresos += Number(i.total_amount) || 0;
    }
    if (i.result === "presupuesto") stats[key].presup++;
    if (i.result === "seguimiento") stats[key].segs++;
  }

  return Object.entries(stats)
    .map(([uid, v]) => ({ uid, name: profileMap[uid] || "—", ...v }))
    .sort((a, b) => b.ingresos - a.ingresos);
}

/**
 * Get loss reasons distribution.
 */
export function getLossReasons(interactions: Interaction[]): Array<{ name: string; value: number }> {
  const noInteresado = interactions.filter((i) => i.result === "no_interesado");
  return Object.entries(
    noInteresado.reduce((acc: Record<string, number>, i: any) => {
      const r = i.loss_reason || "Sin especificar";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }));
}

/**
 * Get sales by product.
 */
export function getSalesByProduct(interactions: Interaction[]): Array<{ name: string; value: number }> {
  const ventas = interactions.filter((i) => i.result === "venta");
  const productSales: Record<string, number> = {};

  ventas.forEach((v) => {
    if (v.interaction_lines) {
      v.interaction_lines.forEach((l) => {
        const name = l.products?.name || "Sin nombre";
        productSales[name] = (productSales[name] || 0) + (l.line_total || l.quantity * l.unit_price || 0);
      });
    }
  });

  return Object.entries(productSales)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

/**
 * Get sales by province.
 */
export function getSalesByProvince(interactions: Interaction[], clients: Client[]): Array<{ name: string; value: number }> {
  const ventas = interactions.filter((i) => i.result === "venta");
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const provinceSales: Record<string, number> = {};

  ventas.forEach((v) => {
    const prov = clientMap[v.client_id]?.province || "Sin provincia";
    provinceSales[prov] = (provinceSales[prov] || 0) + (Number(v.total_amount) || 0);
  });

  return Object.entries(provinceSales)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

/**
 * Get sales by segment/rubro.
 */
export function getSalesBySegment(interactions: Interaction[], clients: Client[]): Array<{ name: string; value: number }> {
  const ventas = interactions.filter((i) => i.result === "venta");
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const segmentSales: Record<string, number> = {};

  ventas.forEach((v) => {
    const seg = clientMap[v.client_id]?.segment || "Sin rubro";
    segmentSales[seg] = (segmentSales[seg] || 0) + (Number(v.total_amount) || 0);
  });

  return Object.entries(segmentSales)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Get result distribution for pie chart.
 */
export function getResultDistribution(interactions: Interaction[]): Array<{ name: string; value: number }> {
  const RESULT_LABELS: Record<string, string> = {
    presupuesto: "Presupuestos",
    venta: "Ventas",
    seguimiento: "Seguimientos",
    sin_respuesta: "Sin respuesta",
    no_interesado: "No interesado",
  };

  return Object.entries(
    interactions.reduce((acc: Record<string, number>, i: any) => {
      acc[i.result] = (acc[i.result] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: RESULT_LABELS[name] || name, value: value as number }));
}

/**
 * Calculate average sales cycle (days from presupuesto to venta).
 */
export function getAvgSalesCycle(interactions: Interaction[]): number {
  const ventas = interactions.filter((i) => i.result === "venta");
  const ventaWithQuote = ventas.filter((v) => v.reference_quote_id);

  if (ventaWithQuote.length === 0) return 0;

  const totalDays = ventaWithQuote.reduce((s: number, v: any) => {
    const quote = interactions.find((q: any) => q.id === v.reference_quote_id);
    if (!quote) return s;
    const days = Math.round(
      (new Date(v.interaction_date).getTime() - new Date(quote.interaction_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return s + days;
  }, 0);

  return Math.round(totalDays / ventaWithQuote.length);
}

export interface WhatsAppStats {
  total: number;
  automaticas: number;
  manuales: number;
  porSemana: Array<{ semana: string; cantidad: number }>;
}

/**
 * Estadísticas de interacciones por WhatsApp en el período. Solo cuenta
 * respuestas ya registradas como Interacción — no hay forma de saber cuántos
 * mensajes salientes se mandaron (el bridge de MejoraWS no emite ese evento,
 * ver mejorasuite/PENDIENTES.md), así que no se calcula una "tasa de
 * respuesta" con eso.
 */
export function getWhatsAppStats(interactions: Interaction[]): WhatsAppStats {
  const wa = interactions.filter((i: any) => i.medium === "whatsapp");
  const automaticas = wa.filter((i: any) => i.followup_scenario === "independiente" && i.result === "seguimiento");
  const manuales = wa.length - automaticas.length;

  const semanas = new Map<string, number>();
  for (const i of wa) {
    const semana = startOfWeek((i as any).interaction_date ? new Date((i as any).interaction_date) : new Date(), { weekStartsOn: 1 });
    const key = semana.toISOString().slice(0, 10);
    semanas.set(key, (semanas.get(key) || 0) + 1);
  }
  const porSemana = Array.from(semanas.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semana, cantidad]) => ({ semana, cantidad }));

  return { total: wa.length, automaticas: automaticas.length, manuales, porSemana };
}
