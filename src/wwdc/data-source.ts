/**
 * WWDC Data Source - Loads data from bundled JSON files
 *
 * This module provides functions to load WWDC video data from
 * JSON files that are bundled with the npm package.
 */

import path from "node:path";

import { z } from "zod";

import { wwdcDataCache } from "../core/cache.ts";
import { AppError, ErrorType } from "../core/errors.ts";
import { logger } from "../core/logger.ts";
import * as dataSourcePath from "./data-source-path.ts";
import { hasText } from "./has-text.ts";
import type {
	GlobalMetadata,
	TopicIndex,
	WWDCVideo,
	YearIndex,
} from "./types.ts";

const isObject = (value: unknown): boolean =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const globalMetadataSchema = z.custom<GlobalMetadata>(isObject);
const topicIndexSchema = z.custom<TopicIndex>(isObject);
const yearIndexSchema = z.custom<YearIndex>(isObject);
const videoSchema = z.custom<WWDCVideo>(isObject);
const videoListSchema = z.custom<WWDCVideo[]>(Array.isArray);

/**
 * Read file from bundled data directory
 */
const readBundledFile = async (filePath: string): Promise<string> => {
	const fullPath = path.join(dataSourcePath.getWWDCDataDirectory(), filePath);

	try {
		const content = await Bun.file(fullPath).text();
		logger.debug(`Loaded bundled data: ${filePath}`);
		return content;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Failed to load WWDC data from ${filePath}: ${errorMessage}`,
			{ cause: error },
		);
	}
};

/**
 * Fetch data with caching support
 */
const fetchData = async (filePath: string): Promise<string> => {
	const cacheKey = `wwdc:${filePath}`;

	const cached = wwdcDataCache.get(cacheKey);
	if (hasText(cached)) {
		logger.debug(`Cache hit: ${filePath}`);
		return cached;
	}

	const data = await readBundledFile(filePath);
	wwdcDataCache.set(cacheKey, data);

	return data;
};

/**
 * Load global metadata (index.json)
 */
export const loadGlobalMetadata = async (): Promise<GlobalMetadata> => {
	try {
		const data = await fetchData("index.json");
		return globalMetadataSchema.parse(JSON.parse(data));
	} catch (error) {
		logger.error("Failed to load global metadata", error);
		throw new Error(
			"Failed to load WWDC metadata. Please ensure the package is properly installed.",
			{ cause: error },
		);
	}
};

/**
 * Load topic index
 */
export const loadTopicIndex = async (topicId: string): Promise<TopicIndex> => {
	try {
		const data = await fetchData(`by-topic/${topicId}/index.json`);
		return topicIndexSchema.parse(JSON.parse(data));
	} catch (error) {
		logger.error(`Failed to load topic index: ${topicId}`, error);
		throw new Error(`Topic not found: ${topicId}`, { cause: error });
	}
};

/**
 * Load year index
 */
export const loadYearIndex = async (year: string): Promise<YearIndex> => {
	try {
		const data = await fetchData(`by-year/${year}/index.json`);
		return yearIndexSchema.parse(JSON.parse(data));
	} catch (error) {
		logger.error(`Failed to load year index: ${year}`, error);
		throw new Error(`Year not found: ${year}`, { cause: error });
	}
};

/**
 * Load individual video data
 */
export const loadVideoData = async (
	year: string,
	videoId: string,
): Promise<WWDCVideo> => {
	try {
		const data = await fetchData(`videos/${year}-${videoId}.json`);
		return videoSchema.parse(JSON.parse(data));
	} catch (error) {
		throw new AppError({
			type: ErrorType.NOT_FOUND,
			message: `Video not found: ${year}-${videoId}`,
			cause: error,
			suggestions: [
				`list_wwdc_videos with year "${year}" lists that year's sessions with their IDs`,
				"search_wwdc_content finds a session by words in its title or transcript",
			],
		});
	}
};

/**
 * Load all videos list
 */
export const loadAllVideos = async (): Promise<WWDCVideo[]> => {
	try {
		const data = await fetchData("all-videos.json");
		return videoListSchema.parse(JSON.parse(data));
	} catch (error) {
		logger.error("Failed to load all videos", error);
		throw new Error("Failed to load WWDC video list", { cause: error });
	}
};

/**
 * Clear the WWDC data cache
 */
export const clearDataCache = (): void => {
	wwdcDataCache.clear();
	logger.info("WWDC data cache cleared");
};
