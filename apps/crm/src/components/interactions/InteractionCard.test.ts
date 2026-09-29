import { describe, it, expect } from "vitest";
import { RESULT_LABELS, RESULT_STYLES, MEDIUM_LABELS } from "@/lib/constants";
import type { Result } from "@/lib/constants";
import { RESULT_ICONS } from "./InteractionCard";

describe("InteractionCard exports", () => {
  it("RESULT_LABELS has all 5 results", () => {
    expect(Object.keys(RESULT_LABELS)).toHaveLength(5);
    expect(RESULT_LABELS.presupuesto).toBe("Envié un presupuesto");
    expect(RESULT_LABELS.venta).toBe("Cerré una venta");
    expect(RESULT_LABELS.seguimiento).toBe("Hice un seguimiento");
    expect(RESULT_LABELS.sin_respuesta).toBe("Sin respuesta");
    expect(RESULT_LABELS.no_interesado).toBe("No le interesó");
  });

  it("RESULT_STYLES has all 5 results", () => {
    expect(Object.keys(RESULT_STYLES)).toHaveLength(5);
    for (const key of Object.keys(RESULT_LABELS)) {
      expect(RESULT_STYLES[key]).toBeDefined();
      expect(typeof RESULT_STYLES[key]).toBe("string");
    }
  });

  it("MEDIUM_LABELS has all expected mediums", () => {
    expect(MEDIUM_LABELS.whatsapp).toBe("WhatsApp");
    expect(MEDIUM_LABELS.llamada).toBe("Llamada");
    expect(MEDIUM_LABELS.email).toBe("Email");
    expect(MEDIUM_LABELS.reunion_presencial).toBe("R. presencial");
    expect(MEDIUM_LABELS.reunion_virtual).toBe("R. virtual");
  });

  it("RESULT_ICONS has all 5 results", () => {
    expect(Object.keys(RESULT_ICONS)).toHaveLength(5);
    for (const key of Object.keys(RESULT_LABELS)) {
      expect(RESULT_ICONS[key as Result]).toBeDefined();
    }
  });
});

describe("Constants consistency", () => {
  it("RESULT_LABELS and RESULT_STYLES have same keys", () => {
    const labelKeys = Object.keys(RESULT_LABELS).sort();
    const styleKeys = Object.keys(RESULT_STYLES).sort();
    expect(labelKeys).toEqual(styleKeys);
  });

  it("RESULT_LABELS and RESULT_ICONS have same keys", () => {
    const labelKeys = Object.keys(RESULT_LABELS).sort();
    const iconKeys = Object.keys(RESULT_ICONS).sort();
    expect(labelKeys).toEqual(iconKeys);
  });
});
