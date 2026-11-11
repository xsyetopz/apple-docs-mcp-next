/**
 * Code examples from the bundled WWDC sessions
 */
import { logger } from "../core/logger.ts";
import {
	loadGlobalMetadata,
	loadTopicIndex,
	loadYearIndex,
} from "./data-source.ts";
import { tidyCode } from "./format.ts";
import { hasText } from "./has-text.ts";
import { loadVideosData } from "./load-videos.ts";
import type { IndexedVideo, WWDCVideo } from "./types.ts";

export interface CodeExamplesQuery {
	framework?: string | undefined;
	topic?: string | undefined;
	year?: string | undefined;
	language?: string | undefined;
	limit: number;
}

interface FoundExample {
	code: string;
	language: string;
	title?: string | undefined;
	timestamp?: string | undefined;
	videoTitle: string;
	videoUrl: string;
	year: string;
}

const matchByKeyword = (videos: IndexedVideo[], topic: string) => {
	const topicLower = topic.toLowerCase();
	return videos.filter(
		(v) =>
			v.topics.some((t) => t.toLowerCase().includes(topicLower)) ||
			v.title.toLowerCase().includes(topicLower),
	);
};

const filterByTopic = async (
	videos: IndexedVideo[],
	topic: string | undefined,
	isTopicId: boolean,
): Promise<IndexedVideo[]> => {
	if (!hasText(topic)) {
		return videos;
	}
	if (!isTopicId) {
		return matchByKeyword(videos, topic);
	}
	try {
		const topicIndex = await loadTopicIndex(topic);
		const topicVideoIds = new Set(topicIndex.videos.map((v) => v.id));
		return videos.filter((v) => topicVideoIds.has(v.id));
	} catch (error) {
		logger.warn("No topic index, matching topic names instead", {
			topic,
			error,
		});
		return matchByKeyword(videos, topic);
	}
};

const examplesOf = (
	video: WWDCVideo,
	year: string,
	{ framework, language }: CodeExamplesQuery,
): FoundExample[] =>
	(video.codeExamples ?? [])
		.filter(
			(example) =>
				(!hasText(language) ||
					example.language.toLowerCase() === language.toLowerCase()) &&
				(!hasText(framework) ||
					example.code.toLowerCase().includes(framework.toLowerCase())),
		)
		.map((example) => ({
			code: example.code,
			language: example.language,
			title: example.title,
			timestamp: example.timestamp,
			videoTitle: video.title,
			videoUrl: video.url,
			year,
		}));

const searchYear = async (
	y: string,
	query: CodeExamplesQuery,
	isTopicId: boolean,
): Promise<FoundExample[]> => {
	try {
		const yearIndex = await loadYearIndex(y);
		const filtered = await filterByTopic(
			yearIndex.videos.filter((v) => v.hasCode),
			query.topic,
			isTopicId,
		);
		const videos = await loadVideosData(filtered.map((v) => v.dataFile));
		return videos.flatMap((video) => examplesOf(video, y, query));
	} catch (error) {
		logger.warn(`Failed to search code examples for year ${y}:`, error);
		return [];
	}
};

const formatCodeExamples = (
	examples: FoundExample[],
	total: number,
): string => {
	if (examples.length === 0) {
		return "No code examples found matching the criteria.";
	}

	let content = `${examples.length} of ${total} code examples\n\n`;

	for (const example of examples) {
		const title = hasText(example.title) ? example.title : "Code Example";
		const at = hasText(example.timestamp) ? ` @ ${example.timestamp}` : "";
		content += `### ${title} · [${example.videoTitle}](${example.videoUrl}) · ${example.year}${at}\n`;
		content += `\`\`\`${example.language}\n${tidyCode(example.code, example.title)}\n\`\`\`\n\n`;
	}

	if (total > examples.length) {
		content += `Showing ${examples.length} of ${total}. Narrow with year, topic or language, or raise limit.\n`;
	}

	return content;
};

/**
 * Get WWDC code examples
 */
export const handleGetWWDCCodeExamples = async (
	query: CodeExamplesQuery,
): Promise<string> => {
	const metadata = await loadGlobalMetadata();
	const yearsToSearch = hasText(query.year) ? [query.year] : metadata.years;
	const isTopicId = metadata.topics.some((t) => t.id === query.topic);

	const perYear = await Promise.all(
		yearsToSearch.map((y) => searchYear(y, query, isTopicId)),
	);
	const codeExamples = perYear.flat();

	return formatCodeExamples(
		codeExamples.slice(0, query.limit),
		codeExamples.length,
	);
};
