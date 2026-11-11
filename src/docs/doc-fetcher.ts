import { apiCache, generateUrlCacheKey } from "../core/cache.ts";
import { AppError, ErrorType, requireText } from "../core/errors.ts";
import { logger } from "../core/logger.ts";
import type { RenderNode } from "../types/docc.ts";
import { hasText } from "./doc-formatter.ts";
import { formatPage } from "./doc-page.ts";
import { fetchRenderNode } from "./docc-json.ts";
import { fetchHelpPage } from "./help-pages.ts";
import { HELP_PATH } from "./search-result-parser.ts";
import {
	absoluteAppleUrl,
	convertToJsonApiUrl,
	isValidAppleDeveloperUrl,
} from "./url-converter.ts";

export interface DocContentQuery {
	url: string;
}

/**
 * One documentation page as Markdown: an App Store Connect Help page from its HTML, any other page from its JSON
 */
export const fetchAppleDocJson = async (
	query: DocContentQuery,
): Promise<string> => {
	requireText(query.url, "URL");
	const url = absoluteAppleUrl(query.url);
	if (!isValidAppleDeveloperUrl(url)) {
		throw new AppError({
			type: ErrorType.INVALID_INPUT,
			message: "URL must be from developer.apple.com",
		});
	}

	try {
		const jsonApiUrl = url.includes(".json") ? url : convertToJsonApiUrl(url);
		if (!hasText(jsonApiUrl)) {
			throw new Error("Invalid Apple Developer Documentation URL");
		}

		const cacheKey = generateUrlCacheKey(jsonApiUrl);
		const cached = apiCache.get(cacheKey);
		if (hasText(cached)) {
			logger.debug(`Cache hit for: ${jsonApiUrl}`);
			return cached;
		}

		const markdown = new URL(url).pathname.startsWith(HELP_PATH)
			? await fetchHelpPage(url)
			: formatPage(await fetchPageJson(jsonApiUrl));
		apiCache.set(cacheKey, markdown);
		return markdown;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logger.error("Error fetching Apple doc JSON:", message);
		throw new AppError({
			type: error instanceof AppError ? error.type : ErrorType.UNKNOWN,
			message: `Failed to get Apple doc content: ${message}`,
			cause: error,
			suggestions: error instanceof AppError ? error.suggestions : [],
		});
	}
};

const fetchPageJson = (jsonApiUrl: string): Promise<RenderNode> => {
	logger.info(`Fetching Apple doc JSON from: ${jsonApiUrl}`);
	return fetchRenderNode(jsonApiUrl);
};
