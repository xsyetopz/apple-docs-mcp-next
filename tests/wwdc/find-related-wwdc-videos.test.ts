/**
 * The find_related_wwdc_videos use cases, over a mocked data source
 */
import { beforeEach, describe, expect, test } from "bun:test";

import { handleFindRelatedWWDCVideos } from "../../src/wwdc/find-related-wwdc-videos.ts";
import type { WWDCVideo } from "../../src/wwdc/types.ts";
import {
	answerVideos,
	type DataSourceSpies,
	makeVideo,
	rejectionOf,
	spyOnDataSource,
} from "./wwdc-fixtures.ts";

const sourceVideo: WWDCVideo = makeVideo({
	title: "SwiftUI Basics",
	duration: "30 min",
	topics: ["SwiftUI & UI Frameworks"],
	relatedVideos: [
		{
			id: "10189",
			year: "2025",
			title: "Advanced SwiftUI",
			url: "https://example.com/10189",
		},
		{
			id: "10190",
			year: "2024",
			title: "SwiftUI Performance",
			url: "https://example.com/10190",
		},
	],
});

const relatedVideos: WWDCVideo[] = [
	makeVideo({
		id: "10189",
		title: "Advanced SwiftUI",
		url: "https://developer.apple.com/videos/play/wwdc2025/10189/",
		duration: "25 min",
		topics: ["SwiftUI & UI Frameworks"],
	}),
	makeVideo({
		id: "10190",
		year: "2024",
		title: "SwiftUI Performance",
		url: "https://developer.apple.com/videos/play/wwdc2024/10190/",
		duration: "20 min",
		topics: ["SwiftUI & UI Frameworks", "Performance"],
		hasCode: false,
	}),
];

const query = {
	videoId: "10188",
	year: "2025",
	includeExplicitRelated: true,
	includeTopicRelated: true,
	includeYearRelated: false,
	limit: 15,
};

describe("handleFindRelatedWWDCVideos", () => {
	let spies: DataSourceSpies;

	beforeEach(() => {
		spies = spyOnDataSource();
		answerVideos(spies, [sourceVideo, ...relatedVideos]);
	});

	test("should find explicitly related videos", async () => {
		const result = await handleFindRelatedWWDCVideos(query);

		expect(result).toContain("# Related to [SwiftUI Basics]");
		expect(result).toContain(
			"- [Advanced SwiftUI](https://developer.apple.com/videos/play/wwdc2025/10189/) · 2025 · 25 min · Explicitly related · transcript, code",
		);
		expect(result).toContain(
			"· 2024 · 20 min · Explicitly related · transcript",
		);
	});

	test("should exclude explicit related when requested", async () => {
		const result = await handleFindRelatedWWDCVideos({
			...query,
			includeExplicitRelated: false,
		});

		expect(result).toContain("# Related to [SwiftUI Basics]");
		expect(result).toContain("No related videos found");
	});

	test("should handle video not found", async () => {
		spies.loadVideoData.mockRejectedValue(new Error("Video not found"));

		expect(
			await rejectionOf(
				handleFindRelatedWWDCVideos({ ...query, videoId: "99999" }),
			),
		).toContain("Video not found");
	});
});
