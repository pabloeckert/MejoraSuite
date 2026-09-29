import { describe, it, expect } from "vitest";
import { flattenInteractionPages } from "./useInteractions";
import { DEMO_INTERACTIONS, DEMO_CLIENTS } from "@/demo/demoData";

describe("flattenInteractionPages", () => {
  it("returns empty array when data is undefined", () => {
    expect(flattenInteractionPages(undefined)).toEqual([]);
  });

  it("returns empty array when pages is empty", () => {
    expect(flattenInteractionPages({ pages: [] })).toEqual([]);
  });

  it("flattens a single page", () => {
    const page = [{ id: "i1", result: "venta" }, { id: "i2", result: "presupuesto" }];
    expect(flattenInteractionPages({ pages: [page] })).toEqual(page);
  });

  it("flattens multiple pages in order", () => {
    const page1 = [{ id: "i1", result: "venta" }];
    const page2 = [{ id: "i2", result: "presupuesto" }];
    const result = flattenInteractionPages({ pages: [page1, page2] });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("i1");
    expect(result[1].id).toBe("i2");
  });

  it("handles partial last page", () => {
    const pages = Array.from({ length: 3 }, (_, i) => [{ id: `i${i}` }]);
    expect(flattenInteractionPages({ pages })).toHaveLength(3);
  });
});

describe("useClientPresupuestos — demo filter logic", () => {
  it("filters interactions by clientId and result=presupuesto", () => {
    const clientId = "c1";
    const result = DEMO_INTERACTIONS.filter(
      (i) => i.client_id === clientId && i.result === "presupuesto"
    );
    expect(result.length).toBeGreaterThan(0);
    for (const i of result) {
      expect(i.client_id).toBe(clientId);
      expect(i.result).toBe("presupuesto");
    }
  });

  it("returns empty for unknown clientId", () => {
    const result = DEMO_INTERACTIONS.filter(
      (i) => i.client_id === "nonexistent" && i.result === "presupuesto"
    );
    expect(result).toHaveLength(0);
  });

  it("presupuesto interactions have total_amount", () => {
    const presupuestos = DEMO_INTERACTIONS.filter((i) => i.result === "presupuesto");
    for (const p of presupuestos) {
      expect(p.total_amount).not.toBeNull();
      expect(typeof p.total_amount).toBe("number");
    }
  });
});

describe("interaction data integrity", () => {
  it("all interactions reference valid clients", () => {
    const clientIds = new Set(DEMO_CLIENTS.map((c) => c.id));
    for (const i of DEMO_INTERACTIONS) {
      expect(clientIds.has(i.client_id)).toBe(true);
    }
  });

  it("interactions have valid date format", () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const i of DEMO_INTERACTIONS) {
      expect(i.interaction_date).toMatch(dateRegex);
    }
  });

  it("follow_up_date is null or valid date", () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const i of DEMO_INTERACTIONS) {
      if (i.follow_up_date !== null) {
        expect(i.follow_up_date).toMatch(dateRegex);
      }
    }
  });
});
