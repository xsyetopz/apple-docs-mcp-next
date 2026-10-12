/**
 * WWDC Data Source - Loads data from bundled JSON files
 *
 * This module provides functions to load WWDC video data from
 * JSON files that are bundled with the npm package.
 */

import path from "node:path";
import { wwdcDataCache } from "../core/cache.ts";
import { logger } from "../core/logger.ts";
import { getWWDCDataDirectory } from "./data-source-path.ts";
import type {
  GlobalMetadata,
  TopicIndex,
  WWDCVideo,
  YearIndex,
} from "./types.ts";

// Get the data directory from the separate module
const WWDC_DATA_DIR = getWWDCDataDirectory();

/**
 * Read file from bundled data directory
 */
async function readBundledFile(filePath: string): Promise<string> {
  const fullPath = path.join(WWDC_DATA_DIR, filePath);

  try {
    const content = await Bun.file(fullPath).text();
    logger.debug(`Loaded bundled data: ${filePath}`);
    return content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to read bundled data: ${filePath}`, error);
    throw new Error(
      `Failed to load WWDC data from ${filePath}: ${errorMessage}`,
      { cause: error },
    );
  }
}

/**
 * Fetch data with caching support
 */
async function fetchData(filePath: string): Promise<string> {
  const cacheKey = `wwdc:${filePath}`;

  // Check cache first
  const cached = wwdcDataCache.get(cacheKey);
  if (cached) {
    logger.debug(`Cache hit: ${filePath}`);
    return cached;
  }

  // Read from bundled data
  const data = await readBundledFile(filePath);

  // Cache the data
  wwdcDataCache.set(cacheKey, data);

  return data;
}

/**
 * Load global metadata (index.json)
 */
export async function loadGlobalMetadata(): Promise<GlobalMetadata> {
  try {
    const data = await fetchData("index.json");
    return JSON.parse(data);
  } catch (error) {
    logger.error("Failed to load global metadata", error);
    throw new Error(
      "Failed to load WWDC metadata. Please ensure the package is properly installed.",
      { cause: error },
    );
  }
}

/**
 * Load topic index
 */
export async function loadTopicIndex(topicId: string): Promise<TopicIndex> {
  try {
    const data = await fetchData(`by-topic/${topicId}/index.json`);
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Failed to load topic index: ${topicId}`, error);
    throw new Error(`Topic not found: ${topicId}`, { cause: error });
  }
}

/**
 * Load year index
 */
export async function loadYearIndex(year: string): Promise<YearIndex> {
  try {
    const data = await fetchData(`by-year/${year}/index.json`);
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Failed to load year index: ${year}`, error);
    throw new Error(`Year not found: ${year}`, { cause: error });
  }
}

/**
 * Load individual video data
 */
export async function loadVideoData(
  year: string,
  videoId: string,
): Promise<WWDCVideo> {
  try {
    const data = await fetchData(`videos/${year}-${videoId}.json`);
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Failed to load video: ${year}-${videoId}`, error);
    throw new Error(`Video not found: ${year}-${videoId}`, { cause: error });
  }
}

/**
 * Load all videos list
 */
export async function loadAllVideos(): Promise<WWDCVideo[]> {
  try {
    const data = await fetchData("all-videos.json");
    return JSON.parse(data);
  } catch (error) {
    logger.error("Failed to load all videos", error);
    throw new Error("Failed to load WWDC video list", { cause: error });
  }
}

/**
 * Clear the WWDC data cache
 */
export function clearDataCache(): void {
  wwdcDataCache.clear();
  logger.info("WWDC data cache cleared");
}
