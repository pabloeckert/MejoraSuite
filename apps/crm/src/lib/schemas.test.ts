import { describe, it, expect } from "vitest";
import { interactionSchema, lineSchema } from "@/lib/schemas";

describe("interactionSchema", () => {
  const validBase = {
    client_id: "550e8400-e29b-41d4-a716-446655440000",
    medium: "whatsapp",
    result: "presupuesto",
  };

  it("accepts valid presupuesto", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "presupuesto",
      quote_path: "catalogo",
      currency: "ARS",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid venta", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "venta",
      currency: "ARS",
      total_amount: 100000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid seguimiento", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "seguimiento",
      followup_scenario: "independiente",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid sin_respuesta", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "sin_respuesta",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid no_interesado with loss_reason", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "no_interesado",
      loss_reason: "Precio",
      currency: "ARS",
      estimated_loss: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects no_interesado without loss_reason", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "no_interesado",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const lossError = result.error.issues.find((i) => i.path.includes("loss_reason"));
      expect(lossError).toBeDefined();
    }
  });

  it("rejects seguimiento without followup_scenario", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      result: "seguimiento",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes("followup_scenario"));
      expect(err).toBeDefined();
    }
  });

  it("rejects empty client_id", () => {
    const result = interactionSchema.safeParse({
      ...validBase,
      client_id: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing medium", () => {
    const result = interactionSchema.safeParse({
      client_id: "550e8400-e29b-41d4-a716-446655440000",
      result: "venta",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing result", () => {
    const result = interactionSchema.safeParse({
      client_id: "550e8400-e29b-41d4-a716-446655440000",
      medium: "whatsapp",
    });
    expect(result.success).toBe(false);
  });
});

describe("lineSchema", () => {
  it("accepts valid line", () => {
    const result = lineSchema.safeParse({
      product_id: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 10,
      unit_price: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts zero quantity", () => {
    const result = lineSchema.safeParse({
      product_id: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 0,
      unit_price: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative quantity", () => {
    const result = lineSchema.safeParse({
      product_id: "550e8400-e29b-41d4-a716-446655440000",
      quantity: -1,
      unit_price: 5000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative unit_price", () => {
    const result = lineSchema.safeParse({
      product_id: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 1,
      unit_price: -100,
    });
    expect(result.success).toBe(false);
  });
});
