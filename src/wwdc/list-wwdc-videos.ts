/**
 * WWDC sessions by year, topic and code, from the bundled data
 */
import { logger } from "../core/logger.ts";
import {
	loadGlobalMetadata,
	loadTopicIndex,
	loadYearIndex,
} from "./data-source.ts";
import { sessionLine } from "./format.ts";
import { hasText } from "./has-text.ts";
import { loadVideosData } from "./load-videos.ts";
import type { WWDCVideo } from "./types.ts";

export interface VideoListQuery {
	year?: string | undefined;
	topic?: string | undefined;
	hasCode?: boolean | undefined;
	limit: number;
}

const topicLabel = (
	topic: { id: string; name: string },
	count?: number,
): string =>
	`${topic.id} (${topic.name}${count === undefined ? "" : `, ${count}`})`;

const formatIndex = async (): Promise<string> => {
	const metadata = await loadGlobalMetadata();
	const stats = metadata.statistics;
	const years = metadata.years.toSorted((a, b) => b.localeCompare(a));
	if (years.length === 0) {
		return "No WWDC years available.";
	}

	const yearList = years
		.map((y) => `${y} (${stats.byYear[y] ?? 0})`)
		.join(", ");
	const topicList = metadata.topics
		.map((t) => topicLabel(t, stats.byTopic[t.id] ?? 0))
		.join(", ");

	return [
		"# WWDC sessions",
		"",
		`Years: ${yearList}`,
		`Total: ${metadata.totalVideos || 0} sessions, ${stats.videosWithCode} with code, ${stats.videosWithTranscript} with transcript`,
		`Topics (id): ${topicList}`,
		"",
		"Pass year, topic (a topic ID or a word) or hasCode to list sessions.",
		"",
	].join("\n");
};

const formatVideoList = (
	videos: WWDCVideo[],
	total: number,
	year?: string,
	topic?: string,
): string => {
	if (videos.length === 0) {
		return "No WWDC videos found matching the criteria.";
	}

	const spansYears = !isSingleYear(year);
	const lines = videos.map((video) =>
		sessionLine(video, { showYear: spansYears, showTopics: !hasText(topic) }),
	);

	let content = `# WWDC sessions\n\n${videos.length} of ${total} sessions\n\n${lines.join("\n")}\n`;
	if (total > videos.length) {
		content += `\nShowing ${videos.length} of ${total}. Narrow with year or topic, or raise limit.\n`;
	}
	return content;
};

const loadByTopicIndex = async (
	topic: string,
	year: string | undefined,
): Promise<WWDCVideo[] | undefined> => {
	try {
		const topicIndex = await loadTopicIndex(topic);
		const videosToLoad = isSingleYear(year)
			? topicIndex.videos.filter((v) => v.year === year)
			: topicIndex.videos;
		return await loadVideosData(videosToLoad.map((v) => v.dataFile));
	} catch (error) {
		logger.warn(
			"Failed to load the topic index, searching by keyword instead",
			{
				topic,
				error,
			},
		);
		return undefined;
	}
};

const withYear = (video: WWDCVideo, year: string): WWDCVideo => ({
	...video,
	year,
});

const loadAllYears = async (years: string[]): Promise<WWDCVideo[]> => {
	const perYear = await Promise.all(
		years.map(async (y) => {
			try {
				const yearIndex = await loadYearIndex(y);
				const videos = await loadVideosData(
					yearIndex.videos.map((v) => v.dataFile),
				);
				return videos.map((v) => withYear(v, y));
			} catch (error) {
				logger.warn(`Failed to load year ${y}:`, error);
				return [];
			}
		}),
	);
	return perYear.flat();
};

const isSingleYear = (year: string | undefined): year is string =>
	hasText(year) && year !== "all";

const loadYear = async (year: string): Promise<WWDCVideo[]> => {
	const yearIndex = await loadYearIndex(year);
	return loadVideosData(yearIndex.videos.map((v) => v.dataFile));
};

const loadCandidates = async (
	years: string[],
	year: string | undefined,
	topic: string | undefined,
	isTopicId: boolean,
): Promise<WWDCVideo[]> => {
	if (isTopicId && hasText(topic)) {
		const byTopicIndex = await loadByTopicIndex(topic, year);
		if (byTopicIndex) {
			return byTopicIndex;
		}
	}
	const videos = isSingleYear(year)
		? await loadYear(year)
		: await loadAllYears(years);
	if (!hasText(topic)) {
		return videos;
	}
	const topicLower = topic.toLowerCase();
	return videos.filter(
		(v) =>
			v.topics.some((t) => t.toLowerCase().includes(topicLower)) ||
			v.title.toLowerCase().includes(topicLower),
	);
};

/**
 * List WWDC videos
 */
export const handleListWWDCVideos = async ({
	year,
	topic,
	hasCode,
	limit,
}: VideoListQuery): Promise<string> => {
	if (year === undefined && topic === undefined && hasCode === undefined) {
		return formatIndex();
	}

	const metadata = await loadGlobalMetadata();
	const isTopicId = metadata.topics.some((t) => t.id === topic);
	let videos = await loadCandidates(metadata.years, year, topic, isTopicId);

	if (hasCode !== undefined) {
		videos = videos.filter((v) => v.hasCode === hasCode);
	}

	const sorted = videos.toSorted((a, b) => Number(b.year) - Number(a.year));
	const limitedVideos = sorted.slice(0, limit);

	if (limitedVideos.length === 0 && hasText(topic) && !isTopicId) {
		return `No WWDC videos found matching the criteria. Topic IDs: ${metadata.topics.map((t) => topicLabel(t)).join(", ")}`;
	}

	return formatVideoList(limitedVideos, sorted.length, year, topic);
};
