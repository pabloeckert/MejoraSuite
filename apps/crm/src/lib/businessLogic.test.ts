import { describe, it, expect } from "vitest";
import {
  getPeriodDates,
  calculatePeriodKPIs,
  calculateTrend,
  filterByPeriodStart,
  getOverdueInteractions,
  getSellerRanking,
  getLossReasons,
  getSalesByProduct,
  getAvgSalesCycle,
  getWhatsAppStats,
  type Period,
} from "@/lib/businessLogic";
import type { Interaction } from "@/lib/types";

function makeInteraction(overrides: Partial<Interaction> = {}): Interaction {
  return {
    id: "test-1",
    client_id: "c1",
    user_id: "u1",
    result: "seguimiento",
    medium: "whatsapp",
    total_amount: null,
    currency: "ARS",
    interaction_date: "2026-04-15",
    follow_up_date: null,
    notes: null,
    estimated_loss: null,
    loss_reason: null,
    next_step: null,
    reference_quote_id: null,
    attachment_url: null,
    followup_scenario: null,
    followup_motive: null,
    negotiation_state: null,
    historic_quote_amount: null,
    historic_quote_date: null,
    quote_path: null,
    created_at: "2026-04-15",
    updated_at: "2026-04-15",
    ...overrides,
  } as Interaction;
}

describe("getPeriodDates", () => {
  const now = new Date("2026-05-13T10:00:00");

  it("returns correct period for 'hoy'", () => {
    const { start, label } = getPeriodDates("hoy", now);
    expect(start.getDate()).toBe(13);
    expect(label).toBe("Hoy");
  });

  it("returns correct period for 'mes'", () => {
    const { start, label } = getPeriodDates("mes", now);
    expect(start.getMonth()).toBe(4); // May (0-indexed)
    expect(start.getDate()).toBe(1);
  });

  it("returns correct period for 'año'", () => {
    const { start } = getPeriodDates("año", now);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
  });
});

describe("calculatePeriodKPIs", () => {
  it("returns zeros for empty interactions", () => {
    const kpis = calculatePeriodKPIs([]);
    expect(kpis.ventasLogradas).toBe(0);
    expect(kpis.ventasEnCurso).toBe(0);
    expect(kpis.tasaConversion).toBe(0);
    expect(kpis.winRate).toBe(0);
  });

  it("calculates ventas correctly", () => {
    const data = [
      makeInteraction({ result: "venta", total_amount: 100000 }),
      makeInteraction({ result: "venta", total_amount: 50000 }),
      makeInteraction({ result: "presupuesto", total_amount: 200000 }),
    ];
    const kpis = calculatePeriodKPIs(data);
    expect(kpis.ventasLogradas).toBe(150000);
    expect(kpis.cantidadVentas).toBe(2);
    expect(kpis.valorPromedioVenta).toBe(75000);
  });

  it("calculates win rate correctly", () => {
    const data = [
      makeInteraction({ result: "venta" }),
      makeInteraction({ result: "venta" }),
      makeInteraction({ result: "no_interesado" }),
    ];
    const kpis = calculatePeriodKPIs(data);
    expect(kpis.winRate).toBe(67); // 2/3 = 66.67 → 67
  });

  it("calculates tasa conversion correctly", () => {
    const data = [
      makeInteraction({ result: "venta" }),
      makeInteraction({ result: "presupuesto" }),
      makeInteraction({ result: "presupuesto" }),
      makeInteraction({ result: "presupuesto" }),
      makeInteraction({ result: "presupuesto" }),
    ];
    const kpis = calculatePeriodKPIs(data);
    expect(kpis.tasaConversion).toBe(25); // 1/4 = 25%
  });
});

describe("calculateTrend", () => {
  it("calculates positive trend", () => {
    const trend = calculateTrend(150, 100);
    expect(trend.percent).toBe(50);
  });

  it("calculates negative trend", () => {
    const trend = calculateTrend(50, 100);
    expect(trend.percent).toBe(-50);
  });

  it("returns 100% when previous is 0 and current > 0", () => {
    const trend = calculateTrend(100, 0);
    expect(trend.percent).toBe(100);
  });

  it("returns 0% when both are 0", () => {
    const trend = calculateTrend(0, 0);
    expect(trend.percent).toBe(0);
  });
});

describe("filterByPeriodStart", () => {
  it("filters by date", () => {
    const data = [
      makeInteraction({ interaction_date: "2026-04-10" }),
      makeInteraction({ interaction_date: "2026-03-10" }),
      makeInteraction({ interaction_date: "2026-04-01" }),
    ];
    const result = filterByPeriodStart(data, new Date("2026-04-01"));
    expect(result).toHaveLength(2);
  });
});

describe("getOverdueInteractions", () => {
  it("returns overdue follow-ups", () => {
    const data = [
      makeInteraction({ follow_up_date: "2026-04-10" }),
      makeInteraction({ follow_up_date: "2099-01-01" }),
      makeInteraction({ follow_up_date: null }),
    ];
    const overdue = getOverdueInteractions(data);
    expect(overdue).toHaveLength(1);
  });
});

describe("getSellerRanking", () => {
  it("calculates ranking sorted by ingresos", () => {
    const profileMap = { u1: "Pablo", u2: "Sindy" };
    const data = [
      makeInteraction({ user_id: "u1", result: "venta", total_amount: 100000 }),
      makeInteraction({ user_id: "u2", result: "venta", total_amount: 50000 }),
      makeInteraction({ user_id: "u1", result: "presupuesto", total_amount: 200000 }),
    ];
    const ranking = getSellerRanking(data, profileMap);
    expect(ranking[0].name).toBe("Pablo");
    expect(ranking[0].ingresos).toBe(100000);
    expect(ranking[1].name).toBe("Sindy");
  });
});

describe("getLossReasons", () => {
  it("groups loss reasons", () => {
    const data = [
      makeInteraction({ result: "no_interesado", loss_reason: "Precio" } as any),
      makeInteraction({ result: "no_interesado", loss_reason: "Precio" } as any),
      makeInteraction({ result: "no_interesado", loss_reason: "Tiempo" } as any),
    ];
    const reasons = getLossReasons(data);
    expect(reasons).toHaveLength(2);
    expect(reasons.find((r) => r.name === "Precio")?.value).toBe(2);
  });
});

describe("getSalesByProduct", () => {
  it("aggregates sales by product name", () => {
    const data = [
      makeInteraction({
        result: "venta",
        interaction_lines: [
          { products: { name: "Pino" }, quantity: 10, unit_price: 1000, line_total: 10000 },
        ],
      } as any),
    ];
    const products = getSalesByProduct(data);
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Pino");
    expect(products[0].value).toBe(10000);
  });
});

describe("getAvgSalesCycle", () => {
  it("calculates average days between quote and sale", () => {
    const data = [
      makeInteraction({ id: "q1", result: "presupuesto", interaction_date: "2026-04-01" }),
      makeInteraction({ id: "s1", result: "venta", interaction_date: "2026-04-11", reference_quote_id: "q1" }),
    ];
    const cycle = getAvgSalesCycle(data);
    expect(cycle).toBe(10);
  });

  it("returns 0 when no linked sales", () => {
    const data = [makeInteraction({ result: "venta" })];
    expect(getAvgSalesCycle(data)).toBe(0);
  });
});

describe("getWhatsAppStats", () => {
  it("separates auto-generated interactions from manual ones", () => {
    const data = [
      makeInteraction({ id: "a1", medium: "whatsapp", result: "seguimiento", followup_scenario: "independiente", interaction_date: "2026-04-06" }),
      makeInteraction({ id: "a2", medium: "whatsapp", result: "seguimiento", followup_scenario: "independiente", interaction_date: "2026-04-07" }),
      makeInteraction({ id: "m1", medium: "whatsapp", result: "venta", followup_scenario: null, interaction_date: "2026-04-08" }),
      makeInteraction({ id: "e1", medium: "email", result: "seguimiento", interaction_date: "2026-04-08" }),
    ];
    const stats = getWhatsAppStats(data);
    expect(stats.total).toBe(3);
    expect(stats.automaticas).toBe(2);
    expect(stats.manuales).toBe(1);
    expect(stats.porSemana.reduce((s, w) => s + w.cantidad, 0)).toBe(3);
  });

  it("returns zeros for a period with no WhatsApp interactions", () => {
    const stats = getWhatsAppStats([makeInteraction({ medium: "email" })]);
    expect(stats).toEqual({ total: 0, automaticas: 0, manuales: 0, porSemana: [] });
  });
});
