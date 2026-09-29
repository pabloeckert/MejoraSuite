import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const FORBIDDEN = ["#8B2D6B", "#8b2d6b", "hsl(325", "purple", "violet", "#020659", "#020659".toLowerCase()];
const MC_PRIMARY = "#1A3D84";

describe("Brand colors — no violeta en archivos de marca", () => {
  it("index.html tiene theme-color correcto", () => {
    const html = readFileSync(resolve(__dirname, "../../index.html"), "utf-8");
    expect(html).toContain(`content="${MC_PRIMARY}"`);
    for (const forbidden of FORBIDDEN) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("manifest.json tiene theme_color y background_color correctos", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(__dirname, "../../public/manifest.json"), "utf-8")
    );
    expect(manifest.theme_color).toBe(MC_PRIMARY);
    expect(manifest.background_color).toBe(MC_PRIMARY);
  });

  it("constants.ts no tiene colores violeta", () => {
    const constants = readFileSync(
      resolve(__dirname, "../lib/constants.ts"),
      "utf-8"
    );
    for (const forbidden of FORBIDDEN) {
      expect(constants).not.toContain(forbidden);
    }
  });

  it("index.css no tiene colores violeta fuera de shadcn internals", () => {
    const css = readFileSync(resolve(__dirname, "../index.css"), "utf-8");
    expect(css).not.toContain("#8B2D6B");
    expect(css).not.toContain("#8b2d6b");
  });
});
