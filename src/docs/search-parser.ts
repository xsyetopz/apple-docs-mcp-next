import { z } from "zod";

import { API_LIMITS } from "../core/constants.ts";
import type { SearchDocument } from "../types/captured/search-document.gen.ts";
import { hasText } from "./has-text.ts";
import type { SearchType } from "./search-api.ts";
import type { ApiSearchResult, SearchResult } from "./search-result-parser.ts";
import { parseSearchResult } from "./search-result-parser.ts";

const searchStream = z.object({
	kind: z.string(),
	diff: z
		.object({
			append: z.string().default(""),
			removeLast: z.number().default(0),
		})
		.optional(),
});

const searchDocument = z.custom<SearchDocument>(
	(value) => typeof value === "object" && value !== null,
);

/**
 * Formats search results for display
 */
export const formatSearchResults = (
	results: SearchResult[],
	query: string,
	filterType: SearchType,
	searchUrl: string,
	total: number = results.length,
): string => {
	let content = "# Apple Documentation Search Results\n";
	const videoSuggestion = getVideoSuggestion(query);

	if (results.length === 0) {
		content += videoSuggestion === null ? "\n" : `\n${videoSuggestion}\n`;
		content += formatNoResultsMessage(query, filterType, searchUrl);
		return content;
	}

	content += `${results.length} results\n`;

	if (videoSuggestion !== null) {
		content += `\n${videoSuggestion}`;
	}

	for (const [type, typeResults] of Object.entries(
		groupResultsByType(results),
	)) {
		content += formatResultGroup(type, typeResults);
	}

	if (total > results.length) {
		content += `\nShowing ${results.length} of ${total}. Narrow the query or set type.\n`;
	}

	return content.trimEnd();
};

/**
 * Format no results message
 */
const formatNoResultsMessage = (
	query: string,
	filterType: SearchType,
	searchUrl: string,
): string => {
	let content = "## No Results Found\n\n";
	content += `No ${filterType === "all" ? "" : `${filterType} `}results found for "${query}".\n\n`;
	content += "### Suggestions:\n";
	content += "- Try using different keywords\n";
	content += "- Check spelling\n";
	content += "- Use more general terms\n";
	content += '- Try searching for framework names (e.g., "SwiftUI", "UIKit")\n';

	if (getVideoSuggestion(query) !== null) {
		content += "- For WWDC videos, use the dedicated WWDC tools\n";
	}

	content += `\n[View search on Apple Developer](${searchUrl})`;
	return content;
};

/**
 * Group results by type
 */
const groupResultsByType = (
	results: SearchResult[],
): Record<string, SearchResult[]> => {
	const groups: Record<string, SearchResult[]> = {};

	for (const result of results) {
		const displayType = getDisplayType(result.type);
		groups[displayType] ??= [];
		groups[displayType].push(result);
	}

	return groups;
};

/**
 * Get display type for result
 */
const getDisplayType = (type: string): string => {
	const typeDisplayNames: Record<string, string> = {
		documentation: "API Documentation",
		"documentation-article": "Articles",
		"documentation-tutorial": "Tutorials",
		"sample-code": "Sample Code",
		"design-guideline": "Design Guidelines",
		"wwdc-session": "WWDC Sessions",
		help: "App Store Connect Help",
		guide: "Guides",
	};

	return typeDisplayNames[type] ?? "Other";
};

/**
 * Format a group of results
 */
const formatResultGroup = (type: string, results: SearchResult[]): string => {
	let content = `\n## ${type}\n`;

	for (const result of results) {
		content += formatSingleResult(result, type === "Other");
	}

	return content;
};

/**
 * Format a single search result on one line: the link, its marks, the description and, for a WWDC session, how to read it
 */
const formatSingleResult = (
	result: SearchResult,
	showType: boolean,
): string => {
	const marks = [
		result.beta === true ? "Beta" : "",
		result.framework ?? "",
		showType ? result.type.replaceAll("-", " ") : "",
	].filter((mark) => hasText(mark));

	let content = `- [${result.title}](${result.url})`;
	if (marks.length > 0) {
		content += ` (${marks.join(", ")})`;
	}
	if (hasText(result.description)) {
		content += `: ${result.description}`;
	}
	if (result.wwdc !== undefined) {
		content += ` · get_wwdc_video (year: "${result.wwdc.year}", videoId: "${result.wwdc.videoId}")`;
	}

	return `${content}\n`;
};

/**
 * Check if query might be video-related and provide WWDC tool suggestions
 */
const getVideoSuggestion = (query: string): string | null => {
	const videoKeywords = [
		"video",
		"wwdc",
		"session",
		"presentation",
		"talk",
		"keynote",
		"demo",
		"tutorial",
		"walkthrough",
		"overview",
		"introduction",
		"deep dive",
		"best practices",
		"tips",
		"tricks",
	];

	const queryLower = query.toLowerCase();
	const hasVideoKeyword = videoKeywords.some((keyword) =>
		queryLower.includes(keyword),
	);
	const hasYearPattern = /\b(20[2-9][0-9]|wwdc[2-9][0-9])\b/iu.test(query);

	if (hasVideoKeyword || hasYearPattern) {
		return "WWDC videos are not searched here: use search_wwdc_content (transcripts and code) or list_wwdc_videos.\n";
	}

	return null;
};

/**
 * Replays the JSON lines Apple's search API streams, as its search page does: each `search` event takes `removeLast`
 * characters off the results document, then appends `append`
 */
export const streamedDocument = (jsonl: string): string => {
	let document = "";
	for (const line of jsonl.split("\n")) {
		if (line.trim() === "") {
			continue;
		}
		const event = searchStream.parse(JSON.parse(line));
		if (event.kind === "search") {
			const { append, removeLast } = event.diff ?? {
				append: "",
				removeLast: 0,
			};
			document =
				document.slice(0, Math.max(0, document.length - removeLast)) + append;
		}
	}
	return document;
};

const streamedResults = (jsonl: string): ApiSearchResult[] => {
	const document = streamedDocument(jsonl);
	return document === ""
		? []
		: searchDocument.parse(JSON.parse(document)).results;
};

/**
 * The results of one or more searches (`all` sends two), in order and each page once, WWDC sessions capped at
 * `MAX_WWDC_RESULTS`
 */
export const parseSearchResults = (
	streams: string[],
	query: string,
	searchUrl: string,
	filterType: SearchType,
): string => {
	const found = streams
		.flatMap((stream) => streamedResults(stream))
		.map((result) => parseSearchResult(result, filterType))
		.filter((result): result is SearchResult => result !== null);
	const parsed = found.filter(
		(result, index) =>
			found.findIndex((other) => other.url === result.url) === index,
	);
	const sessions = new Set(
		parsed
			.filter((result) => result.type === "wwdc-session")
			.slice(0, API_LIMITS.MAX_WWDC_RESULTS),
	);
	const results = parsed
		.filter((result) => result.type !== "wwdc-session" || sessions.has(result))
		.slice(0, API_LIMITS.MAX_SEARCH_RESULTS);

	return formatSearchResults(
		results,
		query,
		filterType,
		searchUrl,
		parsed.length,
	);
};
