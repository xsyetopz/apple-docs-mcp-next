/**
 * The list_wwdc_videos use cases, over a mocked data source
 */
import { beforeEach, describe, expect, test } from "bun:test";

import { handleListWWDCVideos } from "../../src/wwdc/list-wwdc-videos.ts";
import type { GlobalMetadata } from "../../src/wwdc/types.ts";
import {
	answerVideos,
	type DataSourceSpies,
	makeIndexed,
	makeMetadata,
	makeTopicIndex,
	makeVideo,
	makeYearIndex,
	rejectionOf,
	spyOnDataSource,
} from "./wwdc-fixtures.ts";

const metadata: GlobalMetadata = makeMetadata({
	topics: [
		{
			id: "swiftui-ui-frameworks",
			name: "SwiftUI & UI Frameworks",
			url: "https://developer.apple.com/videos/topics/swiftui-ui-frameworks",
		},
		{
			id: "machine-learning-ai",
			name: "Machine Learning & AI",
			url: "https://developer.apple.com/videos/topics/machine-learning-ai",
		},
	],
	years: ["2025", "2024", "2023"],
});

const query = {
	year: undefined,
	topic: undefined,
	hasCode: undefined,
	limit: 50,
};

describe("handleListWWDCVideos", () => {
	let spies: DataSourceSpies;

	beforeEach(() => {
		spies = spyOnDataSource();
		spies.loadGlobalMetadata.mockResolvedValue(metadata);
		answerVideos(spies, [makeVideo()]);
	});

	test("returns the index when no filter is given", async () => {
		spies.loadGlobalMetadata.mockResolvedValue({
			...metadata,
			statistics: {
				byTopic: { "machine-learning-ai": 40, "swiftui-ui-frameworks": 60 },
				byYear: { "2025": 122, "2024": 123, "2023": 316 },
				videosWithCode: 500,
				videosWithTranscript: 1200,
			},
		});

		const result = await handleListWWDCVideos({ ...query, limit: 30 });

		expect(result).toContain("Years: 2025 (122), 2024 (123), 2023 (316)");
		expect(result).toContain(
			"Total: 1266 sessions, 500 with code, 1200 with transcript",
		);
		expect(result).toContain("machine-learning-ai (Machine Learning & AI, 40)");
		expect(result).toContain(
			"swiftui-ui-frameworks (SwiftUI & UI Frameworks, 60)",
		);
		expect(spies.loadYearIndex).not.toHaveBeenCalled();
	});

	test("lists the topic IDs when a topic matches nothing", async () => {
		spies.loadYearIndex.mockResolvedValue(makeYearIndex([]));

		const result = await handleListWWDCVideos({
			...query,
			topic: "machine learning",
			limit: 30,
		});

		expect(result).toContain("No WWDC videos found");
		expect(result).toContain("machine-learning-ai (Machine Learning & AI)");
	});

	test("should list videos across years with the year on each line", async () => {
		spies.loadYearIndex.mockResolvedValue(makeYearIndex([makeIndexed()]));

		const result = await handleListWWDCVideos({ ...query, hasCode: true });

		expect(result).toContain("3 of 3 sessions");
		expect(result).toContain(
			"- [Meet the Translation API](https://developer.apple.com/videos/play/wwdc2025/10188/) · 2025 · 15 min · transcript, code · Machine Learning & AI",
		);
		expect(spies.loadGlobalMetadata).toHaveBeenCalled();
		expect(spies.loadYearIndex).toHaveBeenCalledWith("2025");
	});

	test("should filter videos by year", async () => {
		spies.loadYearIndex.mockResolvedValue(makeYearIndex([makeIndexed()]));

		const result = await handleListWWDCVideos({ ...query, year: "2025" });

		expect(result).toContain("Meet the Translation API");
		expect(result).not.toContain("· 2025 ·");
		expect(spies.loadYearIndex).toHaveBeenCalledWith("2025");
		expect(spies.loadYearIndex).toHaveBeenCalledTimes(1);
	});

	test("should filter videos by topic", async () => {
		spies.loadTopicIndex.mockResolvedValue(
			makeTopicIndex("machine-learning-ai", [makeIndexed()]),
		);

		const result = await handleListWWDCVideos({
			...query,
			topic: "machine-learning-ai",
		});

		expect(result).toContain("Meet the Translation API");
		expect(result).not.toContain("Machine Learning & AI");
		expect(spies.loadTopicIndex).toHaveBeenCalledWith("machine-learning-ai");
	});

	test("should filter videos by code availability", async () => {
		spies.loadYearIndex.mockResolvedValue(
			makeYearIndex([
				makeIndexed(),
				makeIndexed({
					id: "10189",
					title: "No Code Video",
					hasCode: false,
					dataFile: "videos/2025-10189.json",
				}),
			]),
		);
		answerVideos(spies, [
			makeVideo(),
			makeVideo({ id: "10189", title: "No Code Video", hasCode: false }),
		]);

		const result = await handleListWWDCVideos({
			...query,
			year: "2025",
			hasCode: true,
		});

		expect(result).toContain("Meet the Translation API");
		expect(result).not.toContain("No Code Video");
	});

	test("rejects with the failure", async () => {
		spies.loadGlobalMetadata.mockRejectedValue(
			new Error("Failed to load metadata"),
		);

		expect(await rejectionOf(handleListWWDCVideos(query))).toContain(
			"Failed to load metadata",
		);
	});

	test("lists a topic's sessions with its topic ID, year and limit", async () => {
		spies.loadTopicIndex.mockResolvedValue(
			makeTopicIndex("swiftui-ui-frameworks", [
				makeIndexed({ id: "10188", dataFile: "videos/2025-10188.json" }),
				makeIndexed({
					id: "10187",
					year: "2024",
					dataFile: "videos/2024-10187.json",
				}),
				makeIndexed({ id: "10186", dataFile: "videos/2025-10186.json" }),
			]),
		);
		spies.loadVideoData.mockImplementation((year, videoId) =>
			Promise.resolve(
				makeVideo({
					id: videoId,
					year,
					title: `Session ${videoId}`,
					topics: ["SwiftUI & UI Frameworks"],
					duration: "20 min",
					hasCode: false,
				}),
			),
		);

		const result = await handleListWWDCVideos({
			...query,
			year: "2025",
			topic: "swiftui-ui-frameworks",
			limit: 1,
		});

		expect(spies.loadTopicIndex).toHaveBeenCalledWith("swiftui-ui-frameworks");
		expect(result).toContain("1 of 2 sessions");
		expect(result).toContain("Session 10188");
		expect(result).not.toContain("Session 10187");
		expect(result).toContain(
			"Showing 1 of 2. Narrow with year or topic, or raise limit.",
		);
	});
});
