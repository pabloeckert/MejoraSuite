import { describe, it, expect } from "vitest";
import {
  exportCSV,
  exportVCF,
  exportJSON,
  exportJSONL,
  exportGoogleContactsCSV,
  exportHubSpotCSV,
  exportSalesforceCSV,
  exportZohoCSV,
  exportAirtableCSV,
} from "../export-utils";
import type { UnifiedContact } from "@/types/contact";

function makeContact(overrides: Partial<UnifiedContact> = {}): UnifiedContact {
  return {
    id: "1",
    firstName: "Juan",
    lastName: "García",
    whatsapp: "+5491112345678",
    company: "Acme SA",
    jobTitle: "CEO",
    email: "juan@acme.com",
    source: "test.csv",
    isDuplicate: false,
    confidence: 100,
    aiCleaned: false,
    ...overrides,
  };
}

describe("export-utils", () => {
  const contacts = [
    makeContact(),
    makeContact({
      id: "2",
      firstName: "María",
      lastName: "López",
      whatsapp: "+5215512345678",
      company: "Tech Corp",
      jobTitle: "CTO",
      email: "maria@tech.com",
    }),
  ];

  describe("exportCSV", () => {
    it("generates CSV with headers and rows", () => {
      const csv = exportCSV(contacts);
      const lines = csv.split("\n");
      expect(lines[0]).toBe("Nombre,Apellido,WhatsApp,Empresa,Cargo,Email");
      expect(lines[1]).toContain("Juan");
      expect(lines[1]).toContain("juan@acme.com");
    });

    it("escapes values with commas", () => {
      const csv = exportCSV([makeContact({ company: "Acme, Inc." })]);
      expect(csv).toContain('"Acme, Inc."');
    });

    it("escapes values with quotes", () => {
      const csv = exportCSV([makeContact({ company: 'Say "hello"' })]);
      expect(csv).toContain('"Say ""hello"""');
    });

    it("handles empty contacts array", () => {
      const csv = exportCSV([]);
      const lines = csv.split("\n");
      expect(lines).toHaveLength(1); // headers only
    });
  });

  describe("exportVCF", () => {
    it("generates valid vCard format", () => {
      const vcf = exportVCF(contacts);
      expect(vcf).toContain("BEGIN:VCARD");
      expect(vcf).toContain("VERSION:3.0");
      expect(vcf).toContain("END:VCARD");
      expect(vcf).toContain("N:García;Juan;;;")
      expect(vcf).toContain("FN:Juan García");
      expect(vcf).toContain("EMAIL;TYPE=INTERNET:juan@acme.com");
      expect(vcf).toContain("TEL;TYPE=CELL:+5491112345678");
      expect(vcf).toContain("ORG:Acme SA");
      expect(vcf).toContain("TITLE:CEO");
    });

    it("omits empty fields", () => {
      const vcf = exportVCF([makeContact({ email: "", company: "" })]);
      expect(vcf).not.toContain("EMAIL");
      expect(vcf).not.toContain("ORG");
    });

    it("separates multiple vcards with CRLF", () => {
      const vcf = exportVCF(contacts);
      expect(vcf).toContain("END:VCARD\r\nBEGIN:VCARD");
    });
  });

  describe("exportJSON", () => {
    it("generates valid JSON", () => {
      const json = exportJSON(contacts);
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].firstName).toBe("Juan");
    });

    it("pretty-prints with 2-space indent", () => {
      const json = exportJSON(contacts);
      expect(json).toContain("  ");
    });
  });

  describe("exportJSONL", () => {
    it("generates one JSON object per line", () => {
      const jsonl = exportJSONL(contacts);
      const lines = jsonl.split("\n");
      expect(lines).toHaveLength(2);
      for (const line of lines) {
        const parsed = JSON.parse(line);
        expect(parsed.messages).toHaveLength(2);
        expect(parsed.messages[0].role).toBe("user");
        expect(parsed.messages[1].role).toBe("assistant");
      }
    });
  });

  describe("CRM exports use factory pattern", () => {
    it("Google Contacts CSV has correct headers", () => {
      const csv = exportGoogleContactsCSV(contacts);
      const headers = csv.split("\n")[0];
      expect(headers).toBe("Name,Given Name,Family Name,E-mail 1 - Value,Phone 1 - Type,Phone 1 - Value,Organization 1 - Name,Organization 1 - Title");
    });

    it("Google Contacts CSV includes full name in Name column", () => {
      const csv = exportGoogleContactsCSV(contacts);
      expect(csv).toContain("Juan García");
    });

    it("HubSpot CSV has correct headers", () => {
      const csv = exportHubSpotCSV(contacts);
      const headers = csv.split("\n")[0];
      expect(headers).toBe("First Name,Last Name,Email,Phone Number,Company,Job Title");
    });

    it("Salesforce CSV has correct headers", () => {
      const csv = exportSalesforceCSV(contacts);
      const headers = csv.split("\n")[0];
      expect(headers).toBe("First Name,Last Name,Email,Phone,Company,Title");
    });

    it("Zoho CSV has same headers as Salesforce", () => {
      const zoho = exportZohoCSV(contacts);
      const sf = exportSalesforceCSV(contacts);
      expect(zoho.split("\n")[0]).toBe(sf.split("\n")[0]);
    });

    it("Airtable CSV has correct headers", () => {
      const csv = exportAirtableCSV(contacts);
      const headers = csv.split("\n")[0];
      expect(headers).toBe("Name,Email,Phone,Company,Job Title");
    });

    it("all CRM exports handle special characters", () => {
      const special = [makeContact({ email: "a@b.com", company: "Acme, Inc.", firstName: 'Jo "Sm"' })];
      const exports = [
        exportGoogleContactsCSV,
        exportHubSpotCSV,
        exportSalesforceCSV,
        exportZohoCSV,
        exportAirtableCSV,
      ];
      for (const fn of exports) {
        const csv = fn(special);
        // Should not break CSV structure — commas and quotes must be escaped
        const lines = csv.split("\n");
        expect(lines).toHaveLength(2);
      }
    });
  });
});
