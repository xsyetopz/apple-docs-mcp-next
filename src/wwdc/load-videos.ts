/**
 * The sessions behind a list of data files, skipping any that fail to load
 */
import { logger } from "../core/logger.ts";
import { loadVideoData } from "./data-source.ts";
import type { WWDCVideo } from "./types.ts";

const loadVideoFile = async (file: string): Promise<WWDCVideo | undefined> => {
	const match = /(\d{4})-(\d+)\.json$/u.exec(file);
	const year = match?.[1];
	const videoId = match?.[2];
	if (year === undefined || videoId === undefined) {
		return undefined;
	}
	try {
		return await loadVideoData(year, videoId);
	} catch (error) {
		logger.debug(`Failed to load video ${file}:`, error);
		return undefined;
	}
};

/**
 * Helper function to load multiple video data files
 */
export const loadVideosData = async (
	videoFiles: string[],
): Promise<WWDCVideo[]> => {
	const videos = await Promise.all(
		videoFiles.map((file) => loadVideoFile(file)),
	);
	return videos.filter((video) => video !== undefined);
};
