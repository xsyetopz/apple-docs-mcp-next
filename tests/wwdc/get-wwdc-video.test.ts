/**
 * The get_wwdc_video use cases, over a mocked data source
 */
import { beforeEach, describe, expect, test } from "bun:test";

import { handleGetWWDCVideo } from "../../src/wwdc/get-wwdc-video.ts";
import type { WWDCVideo } from "../../src/wwdc/types.ts";
import {
	type DataSourceSpies,
	makeVideo,
	rejectionOf,
	spyOnDataSource,
} from "./wwdc-fixtures.ts";

const fullVideo: WWDCVideo = makeVideo({
	transcript: {
		fullText: "Welcome to the session\nLet us begin",
		segments: [
			{ timestamp: "00:00", text: "Welcome to the session" },
			{ timestamp: "00:30", text: "Let us begin" },
		],
	},
	codeExamples: [
		{
			language: "swift",
			title: "Example Code",
			code: 'let example = "code"',
		},
	],
	resources: {
		resourceLinks: [
			{ title: "Download Sample", url: "https://example.com/sample" },
		],
	},
	relatedVideos: [
		{
			id: "10189",
			year: "2025",
			title: "Related Video 1",
			url: "https://example.com/10189",
		},
		{
			id: "10190",
			year: "2025",
			title: "Related Video 2",
			url: "https://example.com/10190",
		},
	],
});

const query = {
	year: "2025",
	videoId: "10188",
	includeTranscript: true,
	includeCode: true,
};

describe("handleGetWWDCVideo", () => {
	let spies: DataSourceSpies;

	beforeEach(() => {
		spies = spyOnDataSource();
		spies.loadVideoData.mockResolvedValue(fullVideo);
	});

	test("should get full video details with transcript and code", async () => {
		const result = await handleGetWWDCVideo(query);

		expect(result).toContain("Meet the Translation API");
		expect(result).toContain("Welcome to the session");
		expect(result).toContain("Example Code");
		expect(result).toContain("Download Sample");
		expect(spies.loadVideoData).toHaveBeenCalledWith("2025", "10188");
	});

	test("keeps one HD download link and drops the SD one", async () => {
		spies.loadVideoData.mockResolvedValue({
			...fullVideo,
			resources: {
				hdVideo: "https://example.com/hd.mp4",
				sdVideo: "https://example.com/sd.mp4",
			},
		});

		const result = await handleGetWWDCVideo({
			...query,
			includeTranscript: false,
			includeCode: false,
		});

		expect(result).toContain("https://example.com/hd.mp4");
		expect(result).not.toContain("https://example.com/sd.mp4");
		expect(result).toContain("Machine Learning & AI");
		expect(result).toContain("[Related Video 1](https://example.com/10189)");
	});

	test("drops a first comment line that repeats the example title", async () => {
		spies.loadVideoData.mockResolvedValue({
			...fullVideo,
			codeExamples: [
				{
					language: "swift",
					title: "Creating a Generable struct",
					code: "\n// Creating a Generable struct\n\n@Generable\nstruct S {}",
				},
			],
		});

		const result = await handleGetWWDCVideo({
			...query,
			includeTranscript: false,
		});

		expect(result).toContain("```swift\n@Generable\nstruct S {}\n```");
		expect(result).not.toContain("// Creating a Generable struct");
	});

	test("should exclude transcript when requested", async () => {
		const result = await handleGetWWDCVideo({
			...query,
			includeTranscript: false,
		});

		expect(result).toContain("Meet the Translation API");
		expect(result).not.toContain("Welcome to the session");
		expect(result).toContain("Example Code");
	});

	test("says so when a transcript is asked for and the session has none", async () => {
		spies.loadVideoData.mockResolvedValue(makeVideo());

		const asked = await handleGetWWDCVideo(query);
		const notAsked = await handleGetWWDCVideo({
			...query,
			includeTranscript: false,
		});

		expect(asked).toContain(
			"\n## Transcript\n\nThe bundled data has no transcript for this session.\n",
		);
		expect(notAsked).not.toContain("Transcript");
	});

	test("should exclude code when requested", async () => {
		const result = await handleGetWWDCVideo({ ...query, includeCode: false });

		expect(result).toContain("Meet the Translation API");
		expect(result).toContain("Welcome to the session");
		expect(result).not.toContain("Example Code");
	});

	test("should handle missing video", async () => {
		spies.loadVideoData.mockRejectedValue(new Error("Video not found"));

		expect(
			await rejectionOf(handleGetWWDCVideo({ ...query, videoId: "99999" })),
		).toContain("Video not found");
	});
});
