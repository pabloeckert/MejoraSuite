import { describe, it, expect } from "vitest";
import {
  calculateKPIs,
  filterByPeriod,
  getOverdueFollowups,
  isValidWhatsapp,
  calculateSellerRanking,
  phoneDigits,
  samePhone,
  type InteractionSummary,
} from "@/lib/calculations";

// ── calculateKPIs ──────────────────────────────────────────────

describe("calculateKPIs", () => {
  const base: InteractionSummary = {
    result: "seguimiento",
    total_amount: null,
    interaction_date: "2026-04-01",
    follow_up_date: null,
    estimated_loss: null,
  };

  it("returns zeros for empty interactions", () => {
    const kpis = calculateKPIs([]);
    expect(kpis.ventasLogradas).toBe(0);
    expect(kpis.ventasEnCurso).toBe(0);
    expect(kpis.ventasNoConcretadas).toBe(0);
    expect(kpis.tasaConversion).toBe(0);
    expect(kpis.cantidadVentas).toBe(0);
    expect(kpis.cantidadPresupuestos).toBe(0);
  });

  it("calculates ventas logradas correctly", () => {
    const data: InteractionSummary[] = [
      { ...base, result: "venta", total_amount: 100000 },
      { ...base, result: "venta", total_amount: 50000 },
      { ...base, result: "presupuesto", total_amount: 200000 },
    ];
    const kpis = calculateKPIs(data);
    expect(kpis.ventasLogradas).toBe(150000);
    expect(kpis.cantidadVentas).toBe(2);
  });

  it("calculates ventas en curso (presupuestos)", () => {
    const data: InteractionSummary[] = [
      { ...base, result: "presupuesto", total_amount: 300000 },
      { ...base, result: "presupuesto", total_amount: 100000 },
    ];
    const kpis = calculateKPIs(data);
    expect(kpis.ventasEnCurso).toBe(400000);
    expect(kpis.cantidadPresupuestos).toBe(2);
  });

  it("calculates ventas no concretadas (estimated_loss)", () => {
    const data: InteractionSummary[] = [
      { ...base, result: "no_interesado", estimated_loss: 50000 },
      { ...base, result: "no_interesado", estimated_loss: 30000 },
    ];
    const kpis = calculateKPIs(data);
    expect(kpis.ventasNoConcretadas).toBe(80000);
  });

  it("calculates tasa de conversion", () => {
    const data: InteractionSummary[] = [
      { ...base, result: "venta", total_amount: 100 },
      { ...base, result: "venta", total_amount: 100 },
      { ...base, result: "presupuesto", total_amount: 100 },
      { ...base, result: "presupuesto", total_amount: 100 },
      { ...base, result: "presupuesto", total_amount: 100 },
      { ...base, result: "presupuesto", total_amount: 100 },
    ];
    const kpis = calculateKPIs(data);
    // 2 ventas / 4 presupuestos = 50%
    expect(kpis.tasaConversion).toBe(50);
  });

  it("returns 0% conversion when no presupuestos", () => {
    const data: InteractionSummary[] = [
      { ...base, result: "venta", total_amount: 100 },
    ];
    const kpis = calculateKPIs(data);
    expect(kpis.tasaConversion).toBe(0);
  });

  it("handles null total_amount gracefully", () => {
    const data: InteractionSummary[] = [
      { ...base, result: "venta", total_amount: null },
      { ...base, result: "venta", total_amount: 50 },
    ];
    const kpis = calculateKPIs(data);
    expect(kpis.ventasLogradas).toBe(50);
  });
});

// ── filterByPeriod ─────────────────────────────────────────────

describe("filterByPeriod", () => {
  const data: InteractionSummary[] = [
    { result: "venta", total_amount: 1, interaction_date: "2026-04-10", follow_up_date: null, estimated_loss: null },
    { result: "venta", total_amount: 1, interaction_date: "2026-03-10", follow_up_date: null, estimated_loss: null },
    { result: "venta", total_amount: 1, interaction_date: "2026-04-01", follow_up_date: null, estimated_loss: null },
  ];

  it("filters by period start date", () => {
    const result = filterByPeriod(data, new Date("2026-04-01"));
    expect(result).toHaveLength(2);
  });

  it("returns empty if all before period", () => {
    const result = filterByPeriod(data, new Date("2026-05-01"));
    expect(result).toHaveLength(0);
  });

  it("returns all if period is very early", () => {
    const result = filterByPeriod(data, new Date("2026-01-01"));
    expect(result).toHaveLength(3);
  });
});

// ── getOverdueFollowups ────────────────────────────────────────

describe("getOverdueFollowups", () => {
  it("returns interactions with past follow_up_date", () => {
    const data: InteractionSummary[] = [
      { result: "seguimiento", total_amount: null, interaction_date: "2026-04-01", follow_up_date: "2026-04-10", estimated_loss: null },
      { result: "seguimiento", total_amount: null, interaction_date: "2026-04-01", follow_up_date: "2099-01-01", estimated_loss: null },
      { result: "venta", total_amount: 1, interaction_date: "2026-04-01", follow_up_date: null, estimated_loss: null },
    ];
    const overdue = getOverdueFollowups(data);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].follow_up_date).toBe("2026-04-10");
  });

  it("returns empty if no overdue", () => {
    const data: InteractionSummary[] = [
      { result: "seguimiento", total_amount: null, interaction_date: "2026-04-01", follow_up_date: "2099-01-01", estimated_loss: null },
    ];
    expect(getOverdueFollowups(data)).toHaveLength(0);
  });
});

// ── isValidWhatsapp ────────────────────────────────────────────

describe("isValidWhatsapp", () => {
  it("accepts valid international format", () => {
    expect(isValidWhatsapp("+54 376 4000000")).toBe(true);
    expect(isValidWhatsapp("+543764000000")).toBe(true);
    expect(isValidWhatsapp("+1 (555) 123-4567")).toBe(true);
    expect(isValidWhatsapp("3764000000")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidWhatsapp("")).toBe(false);
    expect(isValidWhatsapp("abc")).toBe(false);
    expect(isValidWhatsapp("123")).toBe(false);
    expect(isValidWhatsapp("+")).toBe(false);
  });
});

// ── phoneDigits / samePhone ─────────────────────────────────────
// Usado por WhatsAppCampanas.tsx para matchear la respuesta entrante de un
// evento del bridge de MejoraWS contra el teléfono guardado del cliente.

describe("phoneDigits", () => {
  it("deja solo dígitos", () => {
    expect(phoneDigits("+54 9 376 400-0000")).toBe("5493764000000");
    expect(phoneDigits(null)).toBe("");
    expect(phoneDigits(undefined)).toBe("");
    expect(phoneDigits("")).toBe("");
  });
});

describe("samePhone", () => {
  it("matchea aunque difiera el prefijo de país/el 9 de Argentina", () => {
    expect(samePhone("+54 9 3764 000000", "5493764000000")).toBe(true);
    expect(samePhone("3764000000", "543764000000")).toBe(true);
  });

  it("no matchea números distintos", () => {
    expect(samePhone("3764000000", "3764000001")).toBe(false);
  });

  it("no matchea si alguno es demasiado corto (evita falsos positivos)", () => {
    expect(samePhone("123", "0000000123")).toBe(false);
    expect(samePhone(null, "3764000000")).toBe(false);
    expect(samePhone(undefined, undefined)).toBe(false);
  });
});

// ── calculateSellerRanking ─────────────────────────────────────

describe("calculateSellerRanking", () => {
  const profileMap: Record<string, string> = {
    "u1": "Pablo",
    "u2": "Sindy",
  };

  it("calculates ranking sorted by ingresos", () => {
    const data: InteractionSummary[] = [
      { result: "venta", total_amount: 100000, interaction_date: "2026-04-01", follow_up_date: null, estimated_loss: null } as any,
      { result: "venta", total_amount: 50000, interaction_date: "2026-04-01", follow_up_date: null, estimated_loss: null } as any,
      { result: "presupuesto", total_amount: 200000, interaction_date: "2026-04-01", follow_up_date: null, estimated_loss: null } as any,
    ];
    // Assign user_ids
    (data[0] as any).user_id = "u1";
    (data[1] as any).user_id = "u2";
    (data[2] as any).user_id = "u1";

    const ranking = calculateSellerRanking(data, profileMap);
    expect(ranking[0].name).toBe("Pablo");
    expect(ranking[0].ingresos).toBe(100000);
    expect(ranking[0].ventas).toBe(1);
    expect(ranking[0].presupuestos).toBe(1);
    expect(ranking[1].name).toBe("Sindy");
    expect(ranking[1].ingresos).toBe(50000);
  });

  it("returns empty for no interactions", () => {
    expect(calculateSellerRanking([], profileMap)).toHaveLength(0);
  });
});
