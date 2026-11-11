import { generateUrlCacheKey, updatesCache } from "../core/cache.ts";
import { APPLE_URLS } from "../core/constants.ts";
import { logger } from "../core/logger.ts";
import { fetchRenderIndex, fetchRenderNode } from "./docc-json.ts";
import { formatUpdatesList } from "./documentation-updates-format.ts";
import {
	parseUpdates,
	type UpdateItem,
} from "./documentation-updates-parse.ts";

export interface DocumentationUpdatesQuery {
	category: "all" | "wwdc" | "technology" | "release-notes";
	technology?: string | undefined;
	year?: string | undefined;
	searchQuery?: string | undefined;
	includeBeta: boolean;
	limit: number;
}

const mentions = (update: UpdateItem, needle: string): boolean =>
	update.title.toLowerCase().includes(needle) ||
	update.description.toLowerCase().includes(needle);

const applyUpdatesFilters = (
	updates: UpdateItem[],
	{
		category,
		technology,
		year,
		searchQuery,
		includeBeta,
	}: Omit<DocumentationUpdatesQuery, "limit">,
): UpdateItem[] => {
	const techLower = (technology ?? "").toLowerCase();
	const queryLower = (searchQuery ?? "").toLowerCase();
	return updates.filter(
		(update) =>
			(category === "all" || update.category === category) &&
			(techLower === "" ||
				update.technology?.toLowerCase().includes(techLower) === true ||
				mentions(update, techLower)) &&
			((year ?? "") === "" || update.year === year) &&
			(queryLower === "" || mentions(update, queryLower)) &&
			(includeBeta || update.beta !== true),
	);
};

/**
 * Handle get documentation updates
 */
export const handleGetDocumentationUpdates = async ({
	category,
	technology,
	year,
	searchQuery,
	includeBeta,
	limit,
}: DocumentationUpdatesQuery): Promise<string> => {
	logger.info("Fetching documentation updates...");

	const filters = { category, technology, year, searchQuery, includeBeta };
	const cacheKey = generateUrlCacheKey("documentation-updates", {
		...filters,
		limit,
	});

	const cachedResult = updatesCache.get(cacheKey);
	if (cachedResult !== undefined) {
		logger.debug("Updates cache hit");
		return cachedResult;
	}

	const [updatesData, updatesIndex] = await Promise.all([
		fetchRenderNode(APPLE_URLS.UPDATES_JSON),
		fetchRenderIndex(APPLE_URLS.UPDATES_INDEX_JSON),
	]);

	const filteredUpdates = applyUpdatesFilters(
		parseUpdates(updatesData, updatesIndex),
		filters,
	);
	const shownUpdates =
		limit > 0 ? filteredUpdates.slice(0, limit) : filteredUpdates;

	const result = formatUpdatesList(shownUpdates, filteredUpdates.length);

	updatesCache.set(cacheKey, result);

	return result;
};
