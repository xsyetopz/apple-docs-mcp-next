/**
 * Full-text search of the bundled WWDC transcripts and code
 */
import { logger } from "../core/logger.ts";
import { loadGlobalMetadata, loadYearIndex } from "./data-source.ts";
import { capCodeLines, snippetAround } from "./format.ts";
import { hasText } from "./has-text.ts";
import { loadVideosData } from "./load-videos.ts";
import type { CodeExample, IndexedVideo, WWDCVideo } from "./types.ts";

export interface ContentSearchQuery {
	query: string;
	searchIn: "transcript" | "code" | "both";
	year?: string | undefined;
	language?: string | undefined;
	limit: number;
}

interface Match {
	type: "transcript" | "code";
	context: string;
	timestamp?: string | undefined;
}

interface SearchResult {
	video: WWDCVideo;
	matches: Match[];
}

const MAX_MATCHES_PER_VIDEO = 3;
const CODE_LINES_BEFORE = 2;
const CODE_LINES_AFTER = 6;

const searchInTranscript = (fullText: string, query: string): Match[] => {
	const lines = fullText.split("\n");
	return lines.flatMap((line, i) => {
		if (!line.toLowerCase().includes(query)) {
			return [];
		}
		const context = [lines[i - 1] ?? "", line, lines[i + 1] ?? ""]
			.filter((l) => l.trim())
			.join(" ... ");
		return [
			{ type: "transcript", context: snippetAround(context, query) } as const,
		];
	});
};

const searchInCode = (
	codeExamples: CodeExample[],
	query: string,
	language?: string,
): Match[] =>
	codeExamples.flatMap((example) => {
		if (
			hasText(language) &&
			example.language.toLowerCase() !== language.toLowerCase()
		) {
			return [];
		}
		const lines = example.code.split("\n");
		const at = lines.findIndex((line) => line.toLowerCase().includes(query));
		if (at === -1) {
			return [];
		}
		const snippet = capCodeLines(
			lines
				.slice(Math.max(0, at - CODE_LINES_BEFORE), at + CODE_LINES_AFTER + 1)
				.join("\n")
				.trim(),
		);
		return [
			{
				type: "code",
				context: `${hasText(example.title) ? `${example.title}\n` : ""}\`\`\`${example.language}\n${snippet}\n\`\`\``,
				timestamp: example.timestamp,
			} as const,
		];
	});

const searchVideo = (
	video: WWDCVideo,
	{ searchIn, language }: ContentSearchQuery,
	queryLower: string,
): Match[] => {
	const matches: Match[] = [];
	if ((searchIn === "transcript" || searchIn === "both") && video.transcript) {
		matches.push(...searchInTranscript(video.transcript.fullText, queryLower));
	}
	if ((searchIn === "code" || searchIn === "both") && video.codeExamples) {
		matches.push(...searchInCode(video.codeExamples, queryLower, language));
	}
	return matches;
};

const mightContain = (
	v: IndexedVideo,
	searchIn: ContentSearchQuery["searchIn"],
	queryLower: string,
): boolean =>
	v.title.toLowerCase().includes(queryLower) ||
	v.topics.some((t) => t.toLowerCase().includes(queryLower)) ||
	((searchIn === "code" || searchIn === "both") && v.hasCode) ||
	((searchIn === "transcript" || searchIn === "both") && v.hasTranscript);

const searchYear = async (
	y: string,
	search: ContentSearchQuery,
	queryLower: string,
): Promise<SearchResult[]> => {
	try {
		const yearIndex = await loadYearIndex(y);
		const files = yearIndex.videos
			.filter((v) => mightContain(v, search.searchIn, queryLower))
			.map((v) => v.dataFile);
		const videos = await loadVideosData(files);
		return videos.flatMap((video) => {
			const matches = searchVideo(video, search, queryLower);
			return matches.length > 0
				? [
						{
							video: { ...video, year: y },
							matches: matches.slice(0, MAX_MATCHES_PER_VIDEO),
						},
					]
				: [];
		});
	} catch (error) {
		logger.warn(`Failed to search year ${y}:`, error);
		return [];
	}
};

const formatSearchResults = (
	results: SearchResult[],
	total: number,
	query: string,
	searchIn: ContentSearchQuery["searchIn"],
): string => {
	if (results.length === 0) {
		const kind = searchIn === "both" ? "content" : searchIn;
		return `No ${kind} found containing "${query}".`;
	}

	let content = `# WWDC content matches\n\n${results.length} of ${total} sessions\n\n`;

	for (const result of results) {
		content += `## [${result.video.title}](${result.video.url}) (${result.video.year})\n`;
		for (const match of result.matches) {
			const at = hasText(match.timestamp) ? ` ${match.timestamp}` : "";
			const label = match.type === "code" ? "Code" : "Transcript";
			content += `${label}${at}: ${match.context}\n`;
		}
		content += "\n";
	}

	if (total > results.length) {
		content += `Showing ${results.length} of ${total}. Narrow with year or language, or raise limit.\n`;
	}

	return content;
};

/**
 * Search WWDC content
 */
export const handleSearchWWDCContent = async (
	search: ContentSearchQuery,
): Promise<string> => {
	const metadata = await loadGlobalMetadata();
	const queryLower = search.query.toLowerCase();
	const yearsToSearch = hasText(search.year) ? [search.year] : metadata.years;

	const perYear = await Promise.all(
		yearsToSearch.map((y) => searchYear(y, search, queryLower)),
	);
	const results = perYear
		.flat()
		.toSorted((a, b) => b.matches.length - a.matches.length);

	return formatSearchResults(
		results.slice(0, search.limit),
		results.length,
		search.query,
		search.searchIn,
	);
};
