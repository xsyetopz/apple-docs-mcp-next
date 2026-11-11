import { PROCESSING_LIMITS, SEARCH_DEPTH_LIMITS } from "../core/constants.ts";
import { logger } from "../core/logger.ts";
import type { RenderNode } from "../types/docc.ts";
import { formatInlineContent } from "./doc-formatter.ts";
import { fetchRenderNode } from "./docc-json.ts";
import {
	deduplicateAndScore,
	extractSeeAlsoApis,
	extractTopicApis,
	paragraphsOf,
	type References,
	replacementsIn,
	type SimilarAPI,
} from "./similar-apis-extract.ts";
import { formatSimilarApis } from "./similar-apis-format.ts";
import { convertToJsonApiUrl } from "./url-converter.ts";

export interface SimilarApisQuery {
	apiUrl: string;
	searchDepth: "shallow" | "medium" | "deep";
	filterByCategory?: string | undefined;
	includeAlternatives: boolean;
	limit: number;
}

type Page = RenderNode & { data?: RenderNode };

/** Apple's JSON is the page itself; a page wrapped in `data` keeps its references beside it */
const fetchPage = async (
	url: string,
): Promise<{ data: RenderNode; references: References }> => {
	const response: Page = await fetchRenderNode(url);
	const data = response.data ?? response;
	return { data, references: response.references ?? data.references };
};

const extractDeepRelatedFor = async (
	seedApi: SimilarAPI,
): Promise<SimilarAPI[]> => {
	try {
		const jsonApiUrl = convertToJsonApiUrl(seedApi.url);

		if (jsonApiUrl === null) {
			logger.warn(`Failed to convert URL: ${seedApi.url}`);
			return [];
		}

		const { data, references } = await fetchPage(jsonApiUrl);
		const relatedApis = extractSeeAlsoApis(
			data.seeAlsoSections ?? [],
			references,
		);
		for (const api of relatedApis) {
			api.confidence = Math.max(api.confidence - 2, 3);
			api.similarityType = "Deep Related";
		}
		return relatedApis;
	} catch (error) {
		logger.error(`Failed to fetch deep related API ${seedApi.url}:`, error);
		return [];
	}
};

const extractDeepRelatedApis = async (
	seedApis: SimilarAPI[],
): Promise<SimilarAPI[]> => {
	const perSeed = await Promise.all(
		seedApis.map((seedApi) => extractDeepRelatedFor(seedApi)),
	);
	return perSeed.flat();
};

const findSimilarApis = async (
	{ searchDepth, filterByCategory, includeAlternatives }: SimilarApisQuery,
	data: RenderNode,
	references: References,
): Promise<SimilarAPI[]> => {
	const similarApis = replacementsIn(data.deprecationSummary ?? [], references);

	if (data.seeAlsoSections) {
		similarApis.push(
			...extractSeeAlsoApis(data.seeAlsoSections, references, filterByCategory),
		);
	}

	if (
		(searchDepth === "medium" || searchDepth === "deep") &&
		data.topicSections &&
		includeAlternatives
	) {
		similarApis.push(
			...extractTopicApis(data.topicSections, references, filterByCategory),
		);
	}

	if (searchDepth === "deep") {
		similarApis.push(
			...(await extractDeepRelatedApis(
				similarApis.slice(
					0,
					PROCESSING_LIMITS.MAX_SIMILAR_APIS_FOR_DEEP_SEARCH,
				),
			)),
		);
	}

	return similarApis;
};

export const handleFindSimilarApis = async (
	query: SimilarApisQuery,
): Promise<string> => {
	const { apiUrl, searchDepth, limit } = query;
	try {
		logger.info(`Finding similar APIs for: ${apiUrl}`);

		const jsonApiUrl = convertToJsonApiUrl(apiUrl);

		if (jsonApiUrl === null) {
			throw new Error("Invalid Apple Developer Documentation URL");
		}

		const { data, references } = await fetchPage(jsonApiUrl);
		const uniqueApis = deduplicateAndScore(
			await findSimilarApis(query, data, references),
		).toSorted((a, b) => b.confidence - a.confidence);

		const limitedApis = uniqueApis.slice(
			0,
			Math.min(limit, SEARCH_DEPTH_LIMITS[searchDepth]),
		);

		const deprecationNote = paragraphsOf(data.deprecationSummary ?? [])
			.map((inline) => formatInlineContent(inline, references))
			.join(" ")
			.trim();
		return formatSimilarApis(
			apiUrl,
			limitedApis,
			uniqueApis.length,
			data.metadata?.title ?? "API",
			data,
			deprecationNote,
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes("Invalid Apple Developer Documentation URL")) {
			throw error;
		}
		throw new Error(errorMessage, { cause: error });
	}
};
