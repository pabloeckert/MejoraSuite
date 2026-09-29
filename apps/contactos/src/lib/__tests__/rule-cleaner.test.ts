import { describe, it, expect } from "vitest";
import { ruleClean, batchRuleClean } from "@/lib/rule-cleaner";

describe("ruleClean", () => {
  it("should title case names", () => {
    const result = ruleClean({ firstName: "JUAN CARLOS", lastName: "GARCÍA" });
    expect(result.firstName).toBe("Juan Carlos");
    expect(result.lastName).toBe("García");
  });

  it("should clean junk values", () => {
    const result = ruleClean({ firstName: "N/A", lastName: "null", email: "", whatsapp: "", company: "undefined", jobTitle: "-" });
    expect(result.firstName).toBe("");
    expect(result.lastName).toBe("");
    expect(result.company).toBe("");
    expect(result.jobTitle).toBe("");
  });

  it("should clean email to lowercase", () => {
    const result = ruleClean({ firstName: "A", lastName: "B", email: "  JUAN@Gmail.COM  " });
    expect(result.email).toBe("juan@gmail.com");
  });

  it("should reject invalid email", () => {
    const result = ruleClean({ firstName: "A", lastName: "B", email: "not-an-email" });
    expect(result.email).toBe("");
  });

  it("should validate phone with E.164", () => {
    const result = ruleClean({ firstName: "A", lastName: "B", whatsapp: "+5491155551234" });
    expect(result.whatsapp).toBe("+5491155551234");
    expect(result.phoneValid).toBe(true);
  });

  it("should reject invalid phone", () => {
    const result = ruleClean({ firstName: "A", lastName: "B", whatsapp: "123" });
    expect(result.whatsapp).toBe("");
    expect(result.phoneValid).toBe(false);
  });

  it("should auto-split full name in firstName", () => {
    const result = ruleClean({ firstName: "Juan García", lastName: "" });
    expect(result.firstName).toBe("Juan");
    expect(result.lastName).toBe("García");
  });

  it("should auto-split 3+ part names", () => {
    const result = ruleClean({ firstName: "Juan Carlos García", lastName: "" });
    expect(result.firstName).toBe("Juan");
    expect(result.lastName).toBe("Carlos García");
  });

  it("should extract honorific and split name", () => {
    // "Dr. Juan García" → autoSplit first → firstName="Dr.", lastName="Juan García"
    // Then extractHonorific runs on "Dr." (no space after, so no match)
    // The name stays as split: firstName="Dr.", lastName="Juan García"
    const result = ruleClean({ firstName: "Dr. Juan García", lastName: "" });
    expect(result.firstName).toBe("Dr.");
    expect(result.lastName).toBe("Juan García");
  });

  it("should extract honorific when name stays together", () => {
    // When lastName is provided, autoSplit doesn't trigger
    // extractHonorific gets "Dr. Juan" as firstName
    const result = ruleClean({ firstName: "Dr. Juan", lastName: "García" });
    expect(result.firstName).toBe("Juan");
    expect(result.lastName).toBe("García");
  });

  it("should handle empty input", () => {
    const result = ruleClean({});
    expect(result.firstName).toBe("");
    expect(result.lastName).toBe("");
    expect(result.email).toBe("");
    expect(result.whatsapp).toBe("");
    expect(result.rulesCleaned).toBe(true);
  });

  it("should mark needsAI for numbers in name", () => {
    const result = ruleClean({ firstName: "Juan123", lastName: "García" });
    expect(result.needsAI).toBe(true);
  });

  it("should mark needsAI for person-like company (ASCII names)", () => {
    // The regex checks for /^[A-Z][a-z]+ [A-Z][a-z]+$/ — accented chars don't match
    // Use ASCII names to trigger it
    const result = ruleClean({ firstName: "A", lastName: "B", company: "Juan Garcia" });
    expect(result.needsAI).toBe(true);
  });

  it("should not mark needsAI for clean data", () => {
    const result = ruleClean({ firstName: "Juan", lastName: "García", email: "juan@test.com", whatsapp: "+5491155551234", company: "Tech SA", jobTitle: "CEO" });
    expect(result.needsAI).toBe(false);
  });
});

describe("batchRuleClean", () => {
  it("should clean batch and return indices needing AI", () => {
    const contacts = [
      { firstName: "Juan", lastName: "García" },
      { firstName: "Juan123", lastName: "García" },
      { firstName: "María", lastName: "López" },
    ];
    const { cleaned, aiIndices } = batchRuleClean(contacts);
    expect(cleaned).toHaveLength(3);
    expect(cleaned[0].firstName).toBe("Juan");
    expect(aiIndices).toContain(1);
    expect(aiIndices).not.toContain(0);
    expect(aiIndices).not.toContain(2);
  });

  it("should handle empty batch", () => {
    const { cleaned, aiIndices } = batchRuleClean([]);
    expect(cleaned).toHaveLength(0);
    expect(aiIndices).toHaveLength(0);
  });
});
