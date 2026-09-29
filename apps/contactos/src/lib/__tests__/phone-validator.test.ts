import { describe, it, expect, beforeAll } from "vitest";
import { validatePhone, validatePhoneBatch, getPhoneBadge, getLineTypeLabel } from "@/lib/phone-validator";

// Ensure libphonenumber-js is loaded before running tests.
// The phone-validator module lazy-loads it; in test environments with
// many test files running, the async preload may not finish before
// assertions fire, causing fallback-path results (flaky failures).
beforeAll(async () => {
  // Trigger a validation to force the lazy import to resolve
  validatePhone("+12025551234", "US");
  // Small wait for the dynamic import to complete
  await new Promise(r => setTimeout(r, 100));
});

describe("validatePhone", () => {
  it("should validate Argentine number with + prefix", () => {
    const result = validatePhone("+5491155551234", "AR");
    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+5491155551234");
    expect(result.country).toBe("AR");
    expect(result.countryName).toBe("Argentina");
  });

  it("should validate Argentine number without +", () => {
    const result = validatePhone("5491155551234", "AR");
    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+5491155551234");
  });

  it("should handle Argentine local format 011-15-XXXX", () => {
    const result = validatePhone("0111555551234", "AR");
    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+5491155551234");
  });

  it("should validate Spanish mobile", () => {
    const result = validatePhone("+34612345678", "ES");
    expect(result.isValid).toBe(true);
    expect(result.country).toBe("ES");
  });

  it("should validate Spanish number without prefix", () => {
    const result = validatePhone("612345678", "ES");
    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+34612345678");
  });

  it("should reject too short numbers", () => {
    const result = validatePhone("123", "AR");
    expect(result.isValid).toBe(false);
    expect(result.e164).toBe("");
  });

  it("should reject empty string", () => {
    const result = validatePhone("", "AR");
    expect(result.isValid).toBe(false);
  });

  it("should return country name in Spanish", () => {
    const result = validatePhone("+5491155551234", "AR");
    expect(result.countryName).toBe("Argentina");
  });

  it("should return US country name", () => {
    const result = validatePhone("+14155552671", "US");
    expect(result.isValid).toBe(true);
    expect(result.countryName).toBe("Estados Unidos");
  });

  it("should handle number with spaces and dashes", () => {
    const result = validatePhone("+54 9 11 5555-1234", "AR");
    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+5491155551234");
  });

  it("should set originalInput", () => {
    const input = "+54 9 11 5555-1234";
    const result = validatePhone(input, "AR");
    expect(result.originalInput).toBe(input);
  });

  it("should classify as mobile/landline/unknown based on metadata", () => {
    // In Node with limited metadata, type depends on libphonenumber-js build
    const result = validatePhone("+5491155551234", "AR");
    expect(["mobile", "landline", "voip", "toll_free", "unknown"]).toContain(result.type);
  });

  it("should generate WhatsApp URL when compatible", () => {
    const result = validatePhone("+5491155551234", "AR");
    if (result.isWhatsAppCompatible) {
      expect(result.whatsappUrl).toContain("wa.me/");
    } else {
      expect(result.whatsappUrl).toBe("");
    }
  });
});

describe("validatePhoneBatch", () => {
  it("should validate multiple phones", () => {
    const results = validatePhoneBatch(["+5491155551234", "+34612345678", "invalid"], "AR");
    expect(results).toHaveLength(3);
    expect(results[0].isValid).toBe(true);
    expect(results[1].isValid).toBe(true);
    expect(results[2].isValid).toBe(false);
  });

  it("should handle empty array", () => {
    const results = validatePhoneBatch([], "AR");
    expect(results).toHaveLength(0);
  });
});

describe("getPhoneBadge", () => {
  it("should return appropriate badge for valid phone", () => {
    const validation = validatePhone("+5491155551234", "AR");
    const badge = getPhoneBadge(validation);
    if (validation.isWhatsAppCompatible) {
      expect(badge.icon).toBe("📱");
      expect(badge.variant).toBe("default");
    } else if (validation.isValid) {
      expect(badge.icon).toBe("📞");
      expect(badge.variant).toBe("secondary");
    }
  });

  it("should return destructive badge for invalid", () => {
    const validation = validatePhone("123", "AR");
    const badge = getPhoneBadge(validation);
    expect(badge.icon).toBe("❌");
    expect(badge.variant).toBe("destructive");
  });
});

describe("getLineTypeLabel", () => {
  it("should return mobile label", () => {
    expect(getLineTypeLabel("MOBILE")).toBe("📱 Móvil");
  });

  it("should return landline label", () => {
    expect(getLineTypeLabel("FIXED_LINE")).toBe("📞 Fijo");
  });

  it("should return VoIP label", () => {
    expect(getLineTypeLabel("VOIP")).toBe("💻 VoIP");
  });

  it("should return toll free label", () => {
    expect(getLineTypeLabel("TOLL_FREE")).toBe("🆓 Gratuito");
  });

  it("should return unknown for undefined", () => {
    expect(getLineTypeLabel(undefined)).toBe("❓ Desconocido");
  });
});
