/**
 * The bundled WWDC data itself, read through the real loader (wwdc-data-source.test.ts mocks it).
 */

import { describe, expect, it, mock } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";

// tests/setup.ts points the loader at /mock/data/wwdc for every suite; this one reads the real bundle.
mock.module("../../src/utils/wwdc-data-source-path.ts", () => ({
  getWWDCDataDirectory: () => `${process.cwd()}/data/wwdc`,
}));

// The loader reads the data folder when it loads, so it loads after the mock above.
const { loadGlobalMetadata, loadYearIndex } = await import(
  "../../src/utils/wwdc-data-source.ts"
);

describe("Bundled WWDC data", () => {
  it("covers WWDC26, every session with its data file", async () => {
    const meta = await loadGlobalMetadata();
    expect(meta.years).toContain("2026");
    expect(meta.statistics.byYear["2026"]).toBeGreaterThan(100);
    const year = await loadYearIndex("2026");
    expect(year.videos.length).toBe(meta.statistics.byYear["2026"] ?? 0);
    for (const video of year.videos) {
      expect(existsSync(path.resolve("data/wwdc", video.dataFile))).toBe(true);
    }
  });
});
