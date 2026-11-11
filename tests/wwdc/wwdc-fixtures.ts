import { spyOn } from "bun:test";

import * as dataSource from "../../src/wwdc/data-source.ts";
import type {
	GlobalMetadata,
	IndexedVideo,
	TopicIndex,
	WWDCVideo,
	YearIndex,
} from "../../src/wwdc/types.ts";

const unmocked = (name: string): Error =>
	new Error(`${name} was called without a mocked answer`);

/**
 * Replaces the loaders of the WWDC data source until the test ends. Each one rejects until the test gives it an answer.
 */
export const spyOnDataSource = () => ({
	loadGlobalMetadata: spyOn(dataSource, "loadGlobalMetadata").mockRejectedValue(
		unmocked("loadGlobalMetadata"),
	),
	loadTopicIndex: spyOn(dataSource, "loadTopicIndex").mockRejectedValue(
		unmocked("loadTopicIndex"),
	),
	loadYearIndex: spyOn(dataSource, "loadYearIndex").mockRejectedValue(
		unmocked("loadYearIndex"),
	),
	loadVideoData: spyOn(dataSource, "loadVideoData").mockRejectedValue(
		unmocked("loadVideoData"),
	),
});

export type DataSourceSpies = ReturnType<typeof spyOnDataSource>;

export const makeMetadata = (
	overrides: Partial<GlobalMetadata> = {},
): GlobalMetadata => ({
	version: "1.0",
	lastUpdated: "2025-01-01",
	totalVideos: 1266,
	topics: [],
	years: ["2025"],
	statistics: {
		byTopic: {},
		byYear: {},
		videosWithCode: 500,
		videosWithTranscript: 1200,
	},
	...overrides,
});

export const makeVideo = (overrides: Partial<WWDCVideo> = {}): WWDCVideo => ({
	id: "10188",
	year: "2025",
	url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
	title: "Meet the Translation API",
	duration: "15 min",
	topics: ["Machine Learning & AI"],
	hasTranscript: true,
	hasCode: true,
	resources: {},
	...overrides,
});

export const makeIndexed = (
	overrides: Partial<IndexedVideo> = {},
): IndexedVideo => ({
	id: "10188",
	year: "2025",
	title: "Meet the Translation API",
	topics: ["Machine Learning & AI"],
	duration: "15 min",
	hasCode: true,
	hasTranscript: true,
	url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
	dataFile: "videos/2025-10188.json",
	...overrides,
});

export const makeYearIndex = (
	videos: IndexedVideo[],
	year = "2025",
): YearIndex => ({
	year,
	videoCount: videos.length,
	topics: [],
	videos,
});

export const makeTopicIndex = (
	id: string,
	videos: IndexedVideo[],
): TopicIndex => ({
	id,
	name: id,
	videoCount: videos.length,
	years: [],
	videos,
});

/**
 * The message a promise rejects with, or "resolved" when it does not reject.
 */
export const rejectionOf = async (
	promise: Promise<unknown>,
): Promise<string> => {
	try {
		await promise;
		return "resolved";
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
};

/**
 * Answers `loadVideoData` with the video of the requested id, and rejects for any other id.
 */
export const answerVideos = (
	spies: DataSourceSpies,
	videos: WWDCVideo[],
): void => {
	spies.loadVideoData.mockImplementation((_year, videoId) => {
		const video = videos.find((v) => v.id === videoId);
		return video === undefined
			? Promise.reject(new Error("Video not found"))
			: Promise.resolve(video);
	});
};
