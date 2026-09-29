/**
 * Business logic helpers extracted from Dashboard for testability.
 * Pure functions — no React, no Supabase.
 */

export interface InteractionSummary {
  result: string;
  total_amount: number | null;
  interaction_date: string;
  follow_up_date: string | null;
  estimated_loss: number | null;
}

export interface KPIData {
  ventasLogradas: number;
  ventasEnCurso: number;
  ventasNoConcretadas: number;
  tasaConversion: number;
  cantidadVentas: number;
  cantidadPresupuestos: number;
}

/**
 * Calculate KPIs from a list of interactions within a period.
 */
export function calculateKPIs(interactions: InteractionSummary[]): KPIData {
  const ventas = interactions.filter((i) => i.result === "venta");
  const presupuestos = interactions.filter((i) => i.result === "presupuesto");
  const noInteresado = interactions.filter((i) => i.result === "no_interesado");

  const ventasLogradas = ventas.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const ventasEnCurso = presupuestos.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const ventasNoConcretadas = noInteresado.reduce(
    (s, i) => s + (Number(i.estimated_loss) || 0),
    0
  );
  const tasaConversion =
    presupuestos.length > 0
      ? Math.round((ventas.length / presupuestos.length) * 100)
      : 0;

  return {
    ventasLogradas,
    ventasEnCurso,
    ventasNoConcretadas,
    tasaConversion,
    cantidadVentas: ventas.length,
    cantidadPresupuestos: presupuestos.length,
  };
}

/**
 * Filter interactions by a period start date.
 */
export function filterByPeriod(
  interactions: InteractionSummary[],
  periodStart: Date
): InteractionSummary[] {
  return interactions.filter((i) => new Date(i.interaction_date) >= periodStart);
}

/**
 * Get overdue follow-ups (follow_up_date is in the past).
 */
export function getOverdueFollowups(interactions: InteractionSummary[]): InteractionSummary[] {
  const now = new Date();
  return interactions.filter(
    (i) => i.follow_up_date !== null && new Date(i.follow_up_date) < now
  );
}

/**
 * Validate WhatsApp number format (international format).
 */
export function isValidWhatsapp(value: string): boolean {
  return /^\+?\d[\d\s\-()]{6,20}$/.test(value);
}

/** Deja solo los dígitos de un teléfono. */
export function phoneDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Compara dos teléfonos por los últimos 8 dígitos — no por igualdad
 * estricta — porque el CRM y el JID crudo de WhatsApp pueden traer
 * prefijos de país o el "9" de Argentina de forma inconsistente.
 */
export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = phoneDigits(a);
  const db = phoneDigits(b);
  if (da.length < 8 || db.length < 8) return false;
  return da.slice(-8) === db.slice(-8);
}

/**
 * Calculate seller ranking from interactions + profile map.
 */
export function calculateSellerRanking(
  interactions: InteractionSummary[],
  profileMap: Record<string, string>
): Array<{
  userId: string;
  name: string;
  ventas: number;
  presupuestos: number;
  seguimientos: number;
  ingresos: number;
}> {
  const stats: Record<
    string,
    { ventas: number; presupuestos: number; seguimientos: number; ingresos: number }
  > = {};

  for (const i of interactions) {
    const key = (i as any).user_id;
    if (!key) continue;
    if (!stats[key]) stats[key] = { ventas: 0, presupuestos: 0, seguimientos: 0, ingresos: 0 };

    if (i.result === "venta") {
      stats[key].ventas++;
      stats[key].ingresos += Number(i.total_amount) || 0;
    }
    if (i.result === "presupuesto") stats[key].presupuestos++;
    if (i.result === "seguimiento") stats[key].seguimientos++;
  }

  return Object.entries(stats)
    .map(([userId, v]) => ({
      userId,
      name: profileMap[userId] || "—",
      ...v,
    }))
    .sort((a, b) => b.ingresos - a.ingresos);
}
