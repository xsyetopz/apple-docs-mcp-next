/**
 * Tests for WWDC Data Source, reading a data folder of its own
 */
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { wwdcDataCache } from "../../src/core/cache.ts";
import { logger } from "../../src/core/logger.ts";
import * as dataSourcePath from "../../src/wwdc/data-source-path.ts";
import * as dataSource from "../../src/wwdc/data-source.ts";
import {
	makeIndexed,
	makeMetadata,
	makeTopicIndex,
	makeVideo,
	makeYearIndex,
	rejectionOf,
} from "./wwdc-fixtures.ts";

let dataDir = "";

const writeData = (file: string, data: unknown): Promise<number> =>
	Bun.write(path.join(dataDir, file), JSON.stringify(data));

describe("WWDC Data Source", () => {
	beforeEach(async () => {
		wwdcDataCache.clear();
		dataDir = await mkdtemp(path.join(tmpdir(), "wwdc-data-"));
		spyOn(dataSourcePath, "getWWDCDataDirectory").mockReturnValue(dataDir);
	});

	afterEach(async () => {
		await rm(dataDir, { recursive: true, force: true });
	});

	describe("loadGlobalMetadata", () => {
		it("should load global metadata", async () => {
			const metadata = makeMetadata({ years: ["2023", "2024"] });
			await writeData("index.json", metadata);

			expect(await dataSource.loadGlobalMetadata()).toEqual(metadata);
		});

		it("should handle errors gracefully", async () => {
			expect(await rejectionOf(dataSource.loadGlobalMetadata())).toContain(
				"Failed to load WWDC metadata",
			);
		});
	});

	describe("loadTopicIndex", () => {
		it("should load topic index", async () => {
			const topicIndex = makeTopicIndex("swiftui", [makeIndexed()]);
			await writeData("by-topic/swiftui/index.json", topicIndex);

			expect(await dataSource.loadTopicIndex("swiftui")).toEqual(topicIndex);
		});

		it("should handle non-existent topic", async () => {
			expect(
				await rejectionOf(dataSource.loadTopicIndex("invalid-topic")),
			).toContain("Topic not found: invalid-topic");
		});
	});

	describe("loadYearIndex", () => {
		it("should load year index", async () => {
			const yearIndex = makeYearIndex([makeIndexed()], "2024");
			await writeData("by-year/2024/index.json", yearIndex);

			expect(await dataSource.loadYearIndex("2024")).toEqual(yearIndex);
		});

		it("should handle non-existent year", async () => {
			expect(await rejectionOf(dataSource.loadYearIndex("2099"))).toContain(
				"Year not found: 2099",
			);
		});
	});

	describe("loadVideoData", () => {
		it("should load individual video data", async () => {
			const video = makeVideo({ year: "2024" });
			await writeData("videos/2024-10188.json", video);

			expect(await dataSource.loadVideoData("2024", "10188")).toEqual(video);
		});

		it("should handle non-existent video", async () => {
			expect(
				await rejectionOf(dataSource.loadVideoData("2024", "99999")),
			).toContain("Video not found: 2024-99999");
		});

		it("names the tools that find a session's ID, and logs no error for a wrong one", async () => {
			const logged = spyOn(logger, "error");

			const failure = await dataSource
				.loadVideoData("2024", "99999")
				.catch((error: unknown) => error);

			expect(failure).toMatchObject({
				type: "NOT_FOUND",
				suggestions: [
					'list_wwdc_videos with year "2024" lists that year\'s sessions with their IDs',
					"search_wwdc_content finds a session by words in its title or transcript",
				],
			});
			expect(logged).not.toHaveBeenCalled();
		});
	});

	describe("loadAllVideos", () => {
		it("should load all videos", async () => {
			const videos = [makeVideo(), makeVideo({ id: "10189" })];
			await writeData("all-videos.json", videos);

			expect(await dataSource.loadAllVideos()).toEqual(videos);
		});

		it("should handle loading error", async () => {
			expect(await rejectionOf(dataSource.loadAllVideos())).toContain(
				"Failed to load WWDC video list",
			);
		});
	});

	describe("cache", () => {
		it("serves a file again from the cache after it is removed", async () => {
			const metadata = makeMetadata();
			await writeData("index.json", metadata);
			await dataSource.loadGlobalMetadata();
			await rm(path.join(dataDir, "index.json"));

			expect(await dataSource.loadGlobalMetadata()).toEqual(metadata);
		});

		it("reads the file again after the cache is cleared", async () => {
			await writeData("index.json", makeMetadata());
			await dataSource.loadGlobalMetadata();
			dataSource.clearDataCache();
			await rm(path.join(dataDir, "index.json"));

			expect(await rejectionOf(dataSource.loadGlobalMetadata())).toContain(
				"Failed to load WWDC metadata",
			);
		});
	});
});
