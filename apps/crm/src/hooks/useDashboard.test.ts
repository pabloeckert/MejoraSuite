import { describe, it, expect } from "vitest";
import { DEMO_INTERACTIONS, DEMO_CLIENTS, DEMO_PROFILES } from "@/demo/demoData";

describe("useDashboard — demo data contracts", () => {
  describe("DEMO_INTERACTIONS", () => {
    it("has interactions with required fields", () => {
      for (const i of DEMO_INTERACTIONS) {
        expect(i).toHaveProperty("id");
        expect(i).toHaveProperty("client_id");
        expect(i).toHaveProperty("user_id");
        expect(i).toHaveProperty("result");
        expect(i).toHaveProperty("interaction_date");
        expect(i).toHaveProperty("clients");
      }
    });

    it("all results are valid enum values", () => {
      const validResults = ["venta", "presupuesto", "seguimiento", "no_interesado", "sin_respuesta"];
      for (const i of DEMO_INTERACTIONS) {
        expect(validResults).toContain(i.result);
      }
    });

    it("interactions with amounts have valid numbers", () => {
      const withAmount = DEMO_INTERACTIONS.filter((i) => i.total_amount !== null);
      for (const i of withAmount) {
        expect(typeof i.total_amount).toBe("number");
        expect(i.total_amount).toBeGreaterThan(0);
      }
    });

    it("client references match DEMO_CLIENTS ids", () => {
      const clientIds = new Set(DEMO_CLIENTS.map((c) => c.id));
      for (const i of DEMO_INTERACTIONS) {
        expect(clientIds.has(i.client_id)).toBe(true);
      }
    });

    it("has at least one interaction per result type", () => {
      const results = new Set(DEMO_INTERACTIONS.map((i) => i.result));
      expect(results.has("venta")).toBe(true);
      expect(results.has("presupuesto")).toBe(true);
      expect(results.has("seguimiento")).toBe(true);
      expect(results.has("no_interesado")).toBe(true);
    });

    it("lost interactions have estimated_loss", () => {
      const lost = DEMO_INTERACTIONS.filter((i) => i.result === "no_interesado");
      for (const i of lost) {
        expect(typeof i.estimated_loss).toBe("number");
        expect(i.estimated_loss).toBeGreaterThan(0);
      }
    });
  });

  describe("DEMO_CLIENTS", () => {
    it("has clients with required fields", () => {
      for (const c of DEMO_CLIENTS) {
        expect(c).toHaveProperty("id");
        expect(c).toHaveProperty("name");
        expect(c).toHaveProperty("status");
        expect(c).toHaveProperty("province");
      }
    });

    it("all statuses are valid", () => {
      const valid = ["activo", "potencial", "inactivo"];
      for (const c of DEMO_CLIENTS) {
        expect(valid).toContain(c.status);
      }
    });

    it("has unique client ids", () => {
      const ids = DEMO_CLIENTS.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("DEMO_PROFILES", () => {
    it("has admin and vendedor roles", () => {
      const roles = new Set(DEMO_PROFILES.map((p) => p.role));
      expect(roles.has("admin")).toBe(true);
      expect(roles.has("vendedor")).toBe(true);
    });

    it("profiles have user_id and full_name", () => {
      for (const p of DEMO_PROFILES) {
        expect(p).toHaveProperty("user_id");
        expect(p.full_name.length).toBeGreaterThan(0);
      }
    });
  });
});
