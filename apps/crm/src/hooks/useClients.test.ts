import { describe, it, expect } from "vitest";
import { flattenClientPages } from "./useClients";

describe("flattenClientPages", () => {
  it("returns empty array when data is undefined", () => {
    expect(flattenClientPages(undefined)).toEqual([]);
  });

  it("returns empty array when pages is empty", () => {
    expect(flattenClientPages({ pages: [] })).toEqual([]);
  });

  it("flattens a single page", () => {
    const page = [{ id: "1", name: "Ana" }, { id: "2", name: "Bruno" }] as any[];
    expect(flattenClientPages({ pages: [page] })).toEqual(page);
  });

  it("flattens multiple pages in order", () => {
    const page1 = [{ id: "1", name: "Ana" }] as any[];
    const page2 = [{ id: "2", name: "Bruno" }] as any[];
    const result = flattenClientPages({ pages: [page1, page2] });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Ana");
    expect(result[1].name).toBe("Bruno");
  });

  it("handles pages with empty arrays", () => {
    const page1 = [{ id: "1", name: "Ana" }] as any[];
    const page2: any[] = [];
    const page3 = [{ id: "3", name: "Carlos" }] as any[];
    const result = flattenClientPages({ pages: [page1, page2, page3] });
    expect(result).toHaveLength(2);
  });

  it("returns all items across many pages", () => {
    const pages = Array.from({ length: 5 }, (_, i) => [
      { id: String(i), name: `Client ${i}` },
    ]) as any[][];
    const result = flattenClientPages({ pages });
    expect(result).toHaveLength(5);
  });
});
