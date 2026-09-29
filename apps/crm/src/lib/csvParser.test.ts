import { describe, it, expect } from "vitest";
import { parseCSV, findHeader, getField } from "@/lib/csvParser";

describe("parseCSV", () => {
  it("parses simple CSV", () => {
    const csv = "name,age\nAlice,30\nBob,25";
    const result = parseCSV(csv);
    expect(result.headers).toEqual(["name", "age"]);
    expect(result.rows).toEqual([["Alice", "30"], ["Bob", "25"]]);
  });

  it("handles quoted fields with commas", () => {
    const csv = 'name,address\nAlice,"123 Main St, Apt 4"\nBob,"456 Oak Ave"';
    const result = parseCSV(csv);
    expect(result.rows[0]).toEqual(["Alice", "123 Main St, Apt 4"]);
    expect(result.rows[1]).toEqual(["Bob", "456 Oak Ave"]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    const csv = 'name,note\nAlice,"She said ""hello"""\nBob,"It\'s fine"';
    const result = parseCSV(csv);
    expect(result.rows[0][1]).toBe('She said "hello"');
  });

  it("handles UTF-8 BOM", () => {
    const csv = "\uFEFFname,age\nAlice,30";
    const result = parseCSV(csv);
    expect(result.headers).toEqual(["name", "age"]);
    expect(result.rows).toEqual([["Alice", "30"]]);
  });

  it("handles different line endings", () => {
    const csv = "name,age\r\nAlice,30\r\nBob,25";
    const result = parseCSV(csv);
    expect(result.rows).toHaveLength(2);
  });

  it("handles empty file", () => {
    const result = parseCSV("");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("handles header only (no rows)", () => {
    const result = parseCSV("name,age");
    expect(result.headers).toEqual(["name", "age"]);
    expect(result.rows).toEqual([]);
  });

  it("skips empty lines", () => {
    const csv = "name,age\nAlice,30\n\nBob,25\n";
    const result = parseCSV(csv);
    expect(result.rows).toHaveLength(2);
  });

  it("trims whitespace from headers", () => {
    const csv = " name , age \nAlice,30";
    const result = parseCSV(csv);
    expect(result.headers).toEqual(["name", "age"]);
  });

  it("handles fields with no values", () => {
    const csv = "name,email,phone\nAlice,,555-1234";
    const result = parseCSV(csv);
    expect(result.rows[0]).toEqual(["Alice", "", "555-1234"]);
  });
});

describe("findHeader", () => {
  const headers = ["nombre", "whatsapp", "email", "empresa"];

  it("finds header by exact match", () => {
    expect(findHeader(headers, "email")).toBe(2);
  });

  it("finds header by partial match", () => {
    expect(findHeader(headers, "whats")).toBe(1);
  });

  it("tries multiple candidates", () => {
    expect(findHeader(headers, "phone", "whatsapp")).toBe(1);
  });

  it("returns -1 if not found", () => {
    expect(findHeader(headers, "address", "location")).toBe(-1);
  });

  it("is case insensitive", () => {
    expect(findHeader(headers, "EMAIL")).toBe(2);
  });
});

describe("getField", () => {
  it("returns field value at index", () => {
    expect(getField(["Alice", "30", "NYC"], 1)).toBe("30");
  });

  it("trims whitespace", () => {
    expect(getField([" Alice ", " 30 "], 0)).toBe("Alice");
  });

  it("returns null for empty string", () => {
    expect(getField(["", "30"], 0)).toBeNull();
  });

  it("returns null for out of bounds index", () => {
    expect(getField(["Alice"], 5)).toBeNull();
    expect(getField(["Alice"], -1)).toBeNull();
  });
});
