/**
 * The bundled WWDC data itself, read through the real loader.
 */
import { beforeEach, describe, expect, it } from "bun:test";
import path from "node:path";

import { wwdcDataCache } from "../../src/core/cache.ts";
import {
	loadGlobalMetadata,
	loadYearIndex,
} from "../../src/wwdc/data-source.ts";

describe("Bundled WWDC data", () => {
	beforeEach(() => {
		wwdcDataCache.clear();
	});

	it("covers WWDC26, every session with its data file", async () => {
		const meta = await loadGlobalMetadata();
		expect(meta.years).toContain("2026");
		expect(meta.statistics.byYear["2026"]).toBeGreaterThan(100);
		const year = await loadYearIndex("2026");
		expect(year.videos).toHaveLength(Number(meta.statistics.byYear["2026"]));
		const exists = await Promise.all(
			year.videos.map((video) =>
				Bun.file(path.resolve("data/wwdc", video.dataFile)).exists(),
			),
		);
		expect(exists).not.toContain(false);
	});
});
