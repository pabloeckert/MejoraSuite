/**
 * Tests for Google Contacts Edge Function logic.
 * Tests action routing, response format, and error handling.
 */
import { describe, it, expect } from "vitest";

// ── Response format helper (mirrors Edge Function respond()) ──

function respond(ok: boolean, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ ok, ...payload }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Action routing logic (mirrors Edge Function) ──

type Action = "auth_url" | "exchange" | "refresh" | "fetch_contacts" | "delete_contacts";

function isValidAction(action: string): action is Action {
  return ["auth_url", "exchange", "refresh", "fetch_contacts", "delete_contacts"].includes(action);
}

function buildAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const scopes = [
    "https://www.googleapis.com/auth/contacts",
    "https://www.googleapis.com/auth/contacts.readonly",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
  });
  if (state) params.set("state", state);

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

describe("Google Contacts Edge Function — Action Routing", () => {
  it("recognizes valid actions", () => {
    const validActions: Action[] = ["auth_url", "exchange", "refresh", "fetch_contacts", "delete_contacts"];
    for (const action of validActions) {
      expect(isValidAction(action)).toBe(true);
    }
  });

  it("rejects invalid actions", () => {
    expect(isValidAction("invalid")).toBe(false);
    expect(isValidAction("")).toBe(false);
    expect(isValidAction("hack")).toBe(false);
  });
});

describe("Google Contacts Edge Function — Auth URL", () => {
  it("generates valid Google OAuth URL", () => {
    const url = buildAuthUrl("client-id-123", "https://example.com/callback");
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("client_id=client-id-123");
    expect(url).toContain("redirect_uri=https%3A%2F%2Fexample.com%2Fcallback");
    expect(url).toContain("access_type=offline");
    expect(url).toContain("prompt=consent");
  });

  it("includes contacts scopes", () => {
    const url = buildAuthUrl("client-id", "https://example.com/cb");
    expect(url).toContain("contacts");
    expect(url).toContain("contacts.readonly");
  });

  it("includes state parameter when provided", () => {
    const url = buildAuthUrl("client-id", "https://example.com/cb", "my-state");
    expect(url).toContain("state=my-state");
  });

  it("omits state parameter when not provided", () => {
    const url = buildAuthUrl("client-id", "https://example.com/cb");
    expect(url).not.toContain("state=");
  });
});

describe("Google Contacts Edge Function — Response Format", () => {
  it("success response has ok=true and data", async () => {
    const res = respond(true, { contacts: [], total: 0 });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.contacts).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("error response has ok=false and error message", async () => {
    const res = respond(false, { error: "Something failed" });
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Something failed");
  });

  it("always returns status 200 (client SDK compatibility)", async () => {
    const successRes = respond(true, { data: "ok" });
    const errorRes = respond(false, { error: "fail" });
    expect(successRes.status).toBe(200);
    expect(errorRes.status).toBe(200);
  });
});

describe("Google Contacts Edge Function — Contact Parsing", () => {
  // Test the contact parsing logic from People API response
  function parseContact(person: Record<string, unknown>) {
    const name = (person.names as Array<Record<string, unknown>>)?.[0] || {};
    const email = (person.emailAddresses as Array<Record<string, unknown>>)?.[0]?.value as string || "";
    const phone = (person.phoneNumbers as Array<Record<string, unknown>>)?.[0]?.value as string || "";
    const org = (person.organizations as Array<Record<string, unknown>>)?.[0] || {};

    return {
      firstName: (name.givenName as string) || "",
      lastName: (name.familyName as string) || "",
      email,
      whatsapp: phone,
      company: (org.name as string) || "",
      jobTitle: (org.title as string) || "",
      source: "Google Contacts",
    };
  }

  it("parses complete contact", () => {
    const person = {
      names: [{ givenName: "Juan", familyName: "Pérez" }],
      emailAddresses: [{ value: "juan@example.com" }],
      phoneNumbers: [{ value: "+5491155551234" }],
      organizations: [{ name: "Acme Corp", title: "CEO" }],
    };
    const result = parseContact(person);
    expect(result.firstName).toBe("Juan");
    expect(result.lastName).toBe("Pérez");
    expect(result.email).toBe("juan@example.com");
    expect(result.whatsapp).toBe("+5491155551234");
    expect(result.company).toBe("Acme Corp");
    expect(result.jobTitle).toBe("CEO");
    expect(result.source).toBe("Google Contacts");
  });

  it("handles missing fields gracefully", () => {
    const person = { names: [{ givenName: "Ana" }] };
    const result = parseContact(person);
    expect(result.firstName).toBe("Ana");
    expect(result.lastName).toBe("");
    expect(result.email).toBe("");
    expect(result.whatsapp).toBe("");
    expect(result.company).toBe("");
    expect(result.jobTitle).toBe("");
  });

  it("handles completely empty person", () => {
    const result = parseContact({});
    expect(result.firstName).toBe("");
    expect(result.lastName).toBe("");
    expect(result.email).toBe("");
    expect(result.whatsapp).toBe("");
  });

  it("handles partial names", () => {
    const person = { names: [{ familyName: "García" }] };
    const result = parseContact(person);
    expect(result.firstName).toBe("");
    expect(result.lastName).toBe("García");
  });
});

describe("Google Contacts Edge Function — Delete Batch Logic", () => {
  // Test batch splitting for delete (chunks of 200)
  function splitIntoBatches(resourceNames: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < resourceNames.length; i += batchSize) {
      batches.push(resourceNames.slice(i, i + batchSize));
    }
    return batches;
  }

  it("splits into batches of 200", () => {
    const names = Array.from({ length: 450 }, (_, i) => `people/${i}`);
    const batches = splitIntoBatches(names, 200);
    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(200);
    expect(batches[1]).toHaveLength(200);
    expect(batches[2]).toHaveLength(50);
  });

  it("handles exact batch size", () => {
    const names = Array.from({ length: 200 }, (_, i) => `people/${i}`);
    const batches = splitIntoBatches(names, 200);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(200);
  });

  it("handles fewer than batch size", () => {
    const names = Array.from({ length: 50 }, (_, i) => `people/${i}`);
    const batches = splitIntoBatches(names, 200);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(50);
  });

  it("handles empty array", () => {
    const batches = splitIntoBatches([], 200);
    expect(batches).toHaveLength(0);
  });
});
