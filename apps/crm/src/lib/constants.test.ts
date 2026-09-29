import { describe, it, expect } from "vitest";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  CHANNELS,
  RUBROS,
  PAISES,
  PROVINCIAS,
  UNITS,
  CURRENCIES,
  CURRENCY_SYMBOLS,
  NEGOTIATION_LABELS,
  FOLLOWUP_SCENARIOS,
  LOSS_REASONS,
  CHART_COLORS,
  BRAND,
} from "@/lib/constants";

describe("Client constants", () => {
  it("STATUS_LABELS has 3 statuses", () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(3);
    expect(STATUS_LABELS.activo).toBe("Activo");
    expect(STATUS_LABELS.potencial).toBe("Potencial");
    expect(STATUS_LABELS.inactivo).toBe("Inactivo");
  });

  it("STATUS_STYLES matches STATUS_LABELS keys", () => {
    expect(Object.keys(STATUS_STYLES).sort()).toEqual(Object.keys(STATUS_LABELS).sort());
  });

  it("CHANNELS is non-empty array", () => {
    expect(CHANNELS.length).toBeGreaterThan(0);
    expect(CHANNELS).toContain("WhatsApp");
  });

  it("RUBROS has expected values", () => {
    expect(RUBROS).toContain("Forestal");
    expect(RUBROS).toContain("Agropecuario");
    expect(RUBROS).toContain("Industrial");
  });

  it("PAISES has Argentina", () => {
    expect(PAISES).toContain("Argentina");
  });

  it("PROVINCIAS has all Argentine provinces", () => {
    expect(PROVINCIAS.length).toBeGreaterThanOrEqual(23);
    expect(PROVINCIAS).toContain("Buenos Aires");
    expect(PROVINCIAS).toContain("Misiones");
    expect(PROVINCIAS).toContain("Córdoba");
  });
});

describe("Product constants", () => {
  it("UNITS has common units", () => {
    expect(UNITS.length).toBeGreaterThanOrEqual(10);
    expect(UNITS.map((u) => u.value)).toContain("u");
    expect(UNITS.map((u) => u.value)).toContain("kg");
    expect(UNITS.map((u) => u.value)).toContain("lt");
  });

  it("CURRENCIES has ARS, USD, EUR", () => {
    expect(CURRENCIES).toEqual(["ARS", "USD", "EUR"]);
  });

  it("CURRENCY_SYMBOLS has all currencies", () => {
    expect(CURRENCY_SYMBOLS.ARS).toBe("$");
    expect(CURRENCY_SYMBOLS.USD).toBe("USD");
    expect(CURRENCY_SYMBOLS.EUR).toBe("€");
  });
});

describe("Interaction form constants", () => {
  it("NEGOTIATION_LABELS has 4 states", () => {
    expect(Object.keys(NEGOTIATION_LABELS)).toHaveLength(4);
  });

  it("FOLLOWUP_SCENARIOS has 3 scenarios", () => {
    expect(Object.keys(FOLLOWUP_SCENARIOS)).toHaveLength(3);
    expect(FOLLOWUP_SCENARIOS.vinculado).toBeDefined();
    expect(FOLLOWUP_SCENARIOS.independiente).toBeDefined();
    expect(FOLLOWUP_SCENARIOS.historico).toBeDefined();
  });

  it("LOSS_REASONS is non-empty", () => {
    expect(LOSS_REASONS.length).toBeGreaterThan(0);
    expect(LOSS_REASONS).toContain("Precio");
  });
});

describe("Brand constants", () => {
  it("CHART_COLORS has at least 6 colors", () => {
    expect(CHART_COLORS.length).toBeGreaterThanOrEqual(6);
  });

  it("BRAND has correct MC colors", () => {
    expect(BRAND.primary).toBe("#1A3D84");
    expect(BRAND.accent).toBe("#F7CC13");
    expect(BRAND.success).toBe("#2E7D32");
    expect(BRAND.destructive).toBe("#E1061E");
    expect(BRAND.background).toBe("#FFFFFF");
  });
});
