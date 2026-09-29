/**
 * CSV Parser — handles quoted fields, commas inside quotes, escaped quotes.
 * No external dependencies. Works with UTF-8 BOM.
 */

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
}

/**
 * Parse a CSV string into headers and rows.
 * Handles:
 * - Fields wrapped in double quotes
 * - Commas inside quoted fields
 * - Escaped quotes ("") inside quoted fields
 * - UTF-8 BOM at start of file
 * - Different line endings (\r\n, \n, \r)
 */
export function parseCSV(text: string): CSVParseResult {
  // Remove BOM if present
  const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;

  const lines = splitLines(clean).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    // Skip completely empty rows
    if (row.length === 0 || (row.length === 1 && row[0].trim() === "")) continue;
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Split text into lines, handling different line endings.
 */
function splitLines(text: string): string[] {
  return text.split(/\r\n|\r|\n/);
}

/**
 * Parse a single CSV line into fields.
 * Handles quoted fields with commas and escaped quotes.
 */
function parseLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
        i++;
      } else if (char === ',') {
        // Field separator
        fields.push(current);
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  // Push the last field
  fields.push(current);

  return fields;
}

/**
 * Find the index of a header by trying multiple possible names.
 * Returns -1 if not found.
 */
export function findHeader(headers: string[], ...candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => h.includes(candidate.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Get a field value by index, trimmed, or null if empty/missing.
 */
export function getField(row: string[], index: number): string | null {
  if (index < 0 || index >= row.length) return null;
  const val = row[index]?.trim();
  return val || null;
}
