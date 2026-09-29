import { describe, it, expect, vi, beforeEach } from "vitest";

// Spy on supabase module to verify calls
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({ useDemoMode: () => true }));

import { DEMO_PRODUCTS } from "@/demo/demoData";

describe("useProducts — demo data contract", () => {
  it("demo products have required fields", () => {
    for (const p of DEMO_PRODUCTS) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("price");
      expect(p).toHaveProperty("currency");
      expect(p).toHaveProperty("unit");
      expect(p).toHaveProperty("active");
    }
  });

  it("all demo products are active", () => {
    expect(DEMO_PRODUCTS.every((p) => p.active)).toBe(true);
  });

  it("all demo products have ARS as currency", () => {
    expect(DEMO_PRODUCTS.every((p) => p.currency === "ARS")).toBe(true);
  });

  it("demo products have positive prices", () => {
    expect(DEMO_PRODUCTS.every((p) => (p.price ?? 0) > 0)).toBe(true);
  });

  it("demo products have unique ids", () => {
    const ids = DEMO_PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("demo products have unique names", () => {
    const names = DEMO_PRODUCTS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
