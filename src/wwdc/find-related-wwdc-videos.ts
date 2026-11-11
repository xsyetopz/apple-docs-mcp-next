/**
 * Sessions related to one WWDC session, from the bundled data
 */
import { logger } from "../core/logger.ts";
import {
	loadGlobalMetadata,
	loadTopicIndex,
	loadVideoData,
	loadYearIndex,
} from "./data-source.ts";
import { sessionLine } from "./format.ts";
import { loadVideosData } from "./load-videos.ts";
import type { WWDCVideo } from "./types.ts";

export interface RelatedVideosQuery {
	videoId: string;
	year: string;
	includeExplicitRelated: boolean;
	includeTopicRelated: boolean;
	includeYearRelated: boolean;
	limit: number;
}

interface RelatedEntry {
	video: WWDCVideo & { year: string };
	relationship: string;
	score: number;
}

interface TopicVideos {
	topicName: string;
	videos: WWDCVideo[];
}

const MAX_FILES_PER_SOURCE = 10;

const sharedTopicsOf = (source: WWDCVideo, video: WWDCVideo): string[] =>
	source.topics.filter((t) =>
		video.topics.some((vt) => vt.toLowerCase() === t.toLowerCase()),
	);

const isKnown = (entries: RelatedEntry[], video: WWDCVideo): boolean =>
	entries.some((r) => r.video.id === video.id && r.video.year === video.year);

const loadExplicit = async (source: WWDCVideo): Promise<RelatedEntry[]> => {
	const loaded = await Promise.all(
		(source.relatedVideos ?? []).map(async (related) => {
			try {
				const video = await loadVideoData(related.year, related.id);
				return {
					video: { ...video, year: related.year },
					relationship: "Explicitly related",
					score: 10,
				} satisfies RelatedEntry;
			} catch (error) {
				logger.warn(
					`Failed to load related video ${related.year}-${related.id}:`,
					error,
				);
				return null;
			}
		}),
	);
	return loaded.filter((entry) => entry !== null);
};

const loadTopicVideos = async (
	topic: string,
	videoId: string,
): Promise<TopicVideos | null> => {
	try {
		const metadata = await loadGlobalMetadata();
		const topicEntry = metadata.topics.find(
			(t) =>
				t.name.toLowerCase() === topic.toLowerCase() ||
				t.id
					.toLowerCase()
					.includes(topic.toLowerCase().replaceAll(/\s+/gu, "-")),
		);
		if (!topicEntry) {
			return null;
		}
		const topicIndex = await loadTopicIndex(topicEntry.id);
		const files = topicIndex.videos
			.filter((v) => v.id !== videoId)
			.slice(0, MAX_FILES_PER_SOURCE)
			.map((v) => v.dataFile);
		return { topicName: topicEntry.name, videos: await loadVideosData(files) };
	} catch (error) {
		logger.warn(
			`Failed to find topic-related videos for topic ${topic}:`,
			error,
		);
		return null;
	}
};

const addTopicRelated = async (
	source: WWDCVideo,
	videoId: string,
	entries: RelatedEntry[],
): Promise<void> => {
	const groups = await Promise.all(
		source.topics.map((topic) => loadTopicVideos(topic, videoId)),
	);
	for (const group of groups.filter((g) => g !== null)) {
		for (const video of group.videos) {
			if (!isKnown(entries, video)) {
				entries.push({
					video,
					relationship: `Same topic: ${group.topicName}`,
					score: sharedTopicsOf(source, video).length * 2,
				});
			}
		}
	}
};

const addYearRelated = async (
	source: WWDCVideo,
	query: RelatedVideosQuery,
	entries: RelatedEntry[],
): Promise<void> => {
	try {
		const yearIndex = await loadYearIndex(query.year);
		const files = yearIndex.videos
			.filter(
				(v) =>
					v.id !== query.videoId &&
					v.topics.some((t) =>
						source.topics.some((st) => st.toLowerCase() === t.toLowerCase()),
					),
			)
			.slice(0, MAX_FILES_PER_SOURCE)
			.map((v) => v.dataFile);
		for (const video of await loadVideosData(files)) {
			if (!isKnown(entries, video)) {
				const shared = sharedTopicsOf(source, video);
				entries.push({
					video,
					relationship: `Same year, shared topics: ${shared.join(", ")}`,
					score: shared.length,
				});
			}
		}
	} catch (error) {
		logger.warn("Failed to find year-related videos:", error);
	}
};

const renderRelated = (
	header: string,
	entries: RelatedEntry[],
	limit: number,
): string => {
	const limited = entries.slice(0, limit);
	if (limited.length === 0) {
		return `${header}No related videos found.\n`;
	}
	const lines = limited
		.map((result) =>
			sessionLine(result.video, {
				showYear: true,
				showTopics: false,
				note: result.relationship,
			}),
		)
		.join("\n");
	const more =
		entries.length > limited.length
			? `\nShowing ${limited.length} of ${entries.length}. Raise limit for more.\n`
			: "";
	return `${header}${limited.length} of ${entries.length} sessions\n\n${lines}\n${more}`;
};

/**
 * Find related WWDC videos
 */
export const handleFindRelatedWWDCVideos = async (
	query: RelatedVideosQuery,
): Promise<string> => {
	const { videoId, year, limit } = query;
	const source = await loadVideoData(year, videoId);
	const header = `# Related to [${source.title}](${source.url}) (WWDC${year})\n\n`;

	const entries: RelatedEntry[] = [];
	if (query.includeExplicitRelated) {
		entries.push(...(await loadExplicit(source)));
	}
	if (query.includeTopicRelated) {
		await addTopicRelated(source, videoId, entries);
	}
	if (query.includeYearRelated) {
		await addYearRelated(source, query, entries);
	}

	return renderRelated(
		header,
		entries.toSorted((a, b) => b.score - a.score),
		limit,
	);
};
