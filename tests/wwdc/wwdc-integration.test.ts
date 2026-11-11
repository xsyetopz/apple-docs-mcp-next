/**
 * Integration tests for WWDC tools
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import type { Client } from "@modelcontextprotocol/client";

import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import { callTool, connectClient, textOf } from "../mocks/tool-client.ts";
import {
	type DataSourceSpies,
	makeIndexed,
	makeMetadata,
	makeTopicIndex,
	makeVideo,
	makeYearIndex,
	spyOnDataSource,
} from "./wwdc-fixtures.ts";

describe("WWDC Tools Integration", () => {
	let client: Client;
	let spies: DataSourceSpies;

	beforeEach(async () => {
		spyOnHttpClient();
		spies = spyOnDataSource();
		client = await connectClient();

		spies.loadGlobalMetadata.mockResolvedValue(
			makeMetadata({
				totalVideos: 100,
				topics: [
					{ id: "swiftui", name: "SwiftUI", url: "https://example.com" },
					{
						id: "swiftui-ui-frameworks",
						name: "SwiftUI & UI Frameworks",
						url: "https://example.com",
					},
				],
				years: ["2025", "2024"],
				statistics: {
					byTopic: { swiftui: 10 },
					byYear: { "2025": 50, "2024": 50 },
					videosWithCode: 80,
					videosWithTranscript: 90,
				},
			}),
		);
		spies.loadYearIndex.mockResolvedValue(
			makeYearIndex([
				makeIndexed({
					id: "10001",
					title: "Test Video",
					topics: ["SwiftUI"],
					duration: "20 min",
					dataFile: "videos/2025-10001.json",
					url: "https://example.com/10001",
				}),
			]),
		);
		spies.loadVideoData.mockResolvedValue(
			makeVideo({
				id: "10001",
				title: "Test Video",
				duration: "20 min",
				topics: ["SwiftUI"],
				transcript: { fullText: "Test transcript content", segments: [] },
				codeExamples: [
					{ language: "swift", title: "Example", code: 'print("Hello")' },
				],
				url: "https://example.com/10001",
			}),
		);
		spies.loadTopicIndex.mockResolvedValue(
			makeTopicIndex("swiftui-ui-frameworks", [
				makeIndexed({ id: "10001", dataFile: "videos/2025-10001.json" }),
			]),
		);
	});

	afterEach(async () => {
		await client.close();
	});

	describe("list_wwdc_videos", () => {
		it("should return the index without arguments", async () => {
			const text = textOf(await callTool(client, "list_wwdc_videos", {}));

			expect(text).toContain("Years:");
			expect(text).toContain("2025");
			expect(text).toContain("2024");
			expect(spies.loadGlobalMetadata).toHaveBeenCalled();
		});

		it("should filter videos by year", async () => {
			const text = textOf(
				await callTool(client, "list_wwdc_videos", { year: "2025" }),
			);

			expect(text).toContain("sessions");
			expect(spies.loadYearIndex).toHaveBeenCalledWith("2025");
		});

		it("should filter videos by topic", async () => {
			await callTool(client, "list_wwdc_videos", {
				topic: "swiftui-ui-frameworks",
			});

			expect(spies.loadTopicIndex).toHaveBeenCalledWith(
				"swiftui-ui-frameworks",
			);
		});
	});

	describe("search_wwdc_content", () => {
		it("should search WWDC content", async () => {
			const response = await callTool(client, "search_wwdc_content", {
				query: "SwiftUI",
			});

			expect(response.content).toHaveLength(1);
			expect(spies.loadGlobalMetadata).toHaveBeenCalled();
		});

		it("should search with filters", async () => {
			await callTool(client, "search_wwdc_content", {
				query: "animation",
				year: "2025",
				searchInTranscript: true,
				searchInCode: true,
			});

			expect(spies.loadYearIndex).toHaveBeenCalledWith("2025");
		});
	});

	describe("get_wwdc_video", () => {
		it("should get video details", async () => {
			const text = textOf(
				await callTool(client, "get_wwdc_video", {
					videoId: "10001",
					year: "2025",
				}),
			);

			expect(text).toContain("Test Video");
			expect(spies.loadVideoData).toHaveBeenCalledWith("2025", "10001");
		});

		it("should include transcript when requested", async () => {
			const text = textOf(
				await callTool(client, "get_wwdc_video", {
					videoId: "10001",
					year: "2025",
					includeTranscript: true,
				}),
			);

			expect(text).toContain("transcript");
		});
	});

	describe("get_wwdc_code_examples", () => {
		it("should get code examples", async () => {
			const response = await callTool(client, "get_wwdc_code_examples", {});

			expect(response.content).toHaveLength(1);
			expect(spies.loadGlobalMetadata).toHaveBeenCalled();
		});

		it("should filter by framework", async () => {
			const response = await callTool(client, "get_wwdc_code_examples", {
				framework: "SwiftUI",
			});

			expect(response.content).toHaveLength(1);
		});
	});

	describe("find_related_wwdc_videos", () => {
		it("should find related videos", async () => {
			const response = await callTool(client, "find_related_wwdc_videos", {
				videoId: "10001",
				year: "2025",
			});

			expect(response.content).toHaveLength(1);
			expect(spies.loadVideoData).toHaveBeenCalledWith("2025", "10001");
		});
	});

	describe("error handling", () => {
		it("should handle data loading errors gracefully", async () => {
			spies.loadGlobalMetadata.mockRejectedValue(new Error("Network error"));

			const text = textOf(await callTool(client, "list_wwdc_videos", {}));

			expect(text).toContain("Error");
		});

		it("should handle invalid video ID", async () => {
			spies.loadVideoData.mockRejectedValue(new Error("Video not found"));

			const text = textOf(
				await callTool(client, "get_wwdc_video", {
					videoId: "invalid",
					year: "2025",
				}),
			);

			expect(text).toContain("Error");
		});
	});
});
