/**
 * The sessions behind a list of data files, skipping any that fail to load
 */
import { logger } from "../core/logger.ts";
import { loadVideoData } from "./data-source.ts";
import type { WWDCVideo } from "./types.ts";

/**
 * Helper function to load multiple video data files
 */
export const loadVideosData = async (
  videoFiles: string[],
): Promise<WWDCVideo[]> => {
  const videos: WWDCVideo[] = [];
  for (const file of videoFiles) {
    // Extract year and video ID from filename (e.g., "videos/2024-10015.json")
    const match = file.match(/(\d{4})-(\d+)\.json$/);
    const year = match?.[1];
    const videoId = match?.[2];
    if (year !== undefined && videoId !== undefined) {
      try {
        const video = await loadVideoData(year, videoId);
        videos.push(video);
      } catch (error) {
        // Skip videos that can't be loaded
        logger.debug(`Failed to load video ${file}:`, error);
      }
    }
  }
  return videos;
};
