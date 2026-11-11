import { z } from "zod";

import { generateUrlCacheKey, sampleCodeCache } from "../core/cache.ts";
import { APPLE_URLS } from "../core/constants.ts";
import { httpClient } from "../core/http-client.ts";
import type { RenderIndex, RenderNode } from "../types/docc.ts";
import { hasText } from "./doc-formatter.ts";
import { technologyNames } from "./list-technologies.ts";
import { applySampleCodeFilters } from "./sample-code-filter.ts";
import { formatSampleCodeResult } from "./sample-code-format.ts";
import {
	type ParsedSampleCode,
	parseSampleCodes,
} from "./sample-code-parser.ts";

export interface SampleCodeQuery {
	framework?: string | undefined;
	beta: "include" | "exclude" | "only";
	searchQuery?: string | undefined;
	limit: number;
}

const isJsonObject = (value: unknown): boolean =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const renderNode = z.custom<RenderNode>(isJsonObject);
const renderIndex = z.custom<RenderIndex>(isJsonObject);

const fetchSampleCodes = async (): Promise<ParsedSampleCode[]> => {
	const [contentResponse, indexResponse, names] = await Promise.all([
		httpClient.get(APPLE_URLS.SAMPLE_CODE_JSON),
		httpClient.get(APPLE_URLS.SAMPLE_CODE_INDEX_JSON),
		technologyNames(),
	]);
	if (!contentResponse.ok) {
		throw new Error(
			`Failed to fetch sample code content: ${contentResponse.statusText}`,
		);
	}
	if (!indexResponse.ok) {
		throw new Error(
			`Failed to fetch sample code index: ${indexResponse.statusText}`,
		);
	}
	return parseSampleCodes(
		renderNode.parse(await contentResponse.json()),
		renderIndex.parse(await indexResponse.json()),
		names,
	);
};

/**
 * Handles the get_sample_code tool request
 */
export const handleGetSampleCode = async ({
	framework,
	beta,
	searchQuery,
	limit,
}: SampleCodeQuery): Promise<string> => {
	const cacheKey = generateUrlCacheKey("sample-code", {
		framework,
		beta,
		searchQuery,
		limit,
	});
	const cachedResult = sampleCodeCache.get(cacheKey);
	if (hasText(cachedResult)) {
		return cachedResult;
	}

	const sampleCodes = await fetchSampleCodes();
	const filtered = applySampleCodeFilters(sampleCodes, {
		framework,
		beta,
		searchQuery,
	});
	const limited = filtered
		.toSorted((a, b) => {
			const aFeatured = a.featured === true;
			if (aFeatured !== (b.featured === true)) {
				return aFeatured ? -1 : 1;
			}
			return a.title.localeCompare(b.title);
		})
		.slice(0, limit);

	const result = formatSampleCodeResult(limited, {
		totalFound: filtered.length,
		showing: limited.length,
	});
	sampleCodeCache.set(cacheKey, result);
	return result;
};
