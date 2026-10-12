/**
 * WWDC sessions by year, topic and code, from the bundled data
 */
import { logger } from "../core/logger.ts";
import {
  loadGlobalMetadata,
  loadTopicIndex,
  loadYearIndex,
} from "./data-source.ts";
import { loadVideosData } from "./load-videos.ts";
import type { WWDCVideo } from "./types.ts";

export interface VideoListQuery {
  year?: string | undefined;
  topic?: string | undefined;
  hasCode?: boolean | undefined;
  limit: number;
}

/**
 * List WWDC videos
 */
export async function handleListWWDCVideos({
  year,
  topic,
  hasCode,
  limit,
}: VideoListQuery): Promise<string> {
  try {
    const metadata = await loadGlobalMetadata();

    let allVideos: Array<WWDCVideo & { year: string }> = [];
    // A topic ID is one the bundled data lists ("swift", "swiftui-ui-frameworks"); other text is a word to find
    const isTopicId = metadata.topics.some((t) => t.id === topic);
    let byTopicIndex = false;

    if (topic && isTopicId) {
      try {
        const topicIndex = await loadTopicIndex(topic);

        const videosToLoad =
          year && year !== "all"
            ? topicIndex.videos.filter((v) => v.year === year)
            : topicIndex.videos;

        const videoFiles = videosToLoad.map((v) => v.dataFile);
        const videos = await loadVideosData(videoFiles);

        allVideos = videos.map((v: WWDCVideo) => ({ ...v, year: v.year }));
        byTopicIndex = true;
      } catch (error) {
        logger.warn(
          "Failed to load the topic index, searching by keyword instead",
          { topic, error },
        );
        // Fall through to load by year and filter by keyword
      }
    }

    if (!byTopicIndex && year && year !== "all") {
      const yearIndex = await loadYearIndex(year);

      const videoFiles = yearIndex.videos.map((v) => v.dataFile);
      const videos = await loadVideosData(videoFiles);

      allVideos = videos.map((v: WWDCVideo) => ({ ...v, year: v.year }));
    } else if (!byTopicIndex) {
      const yearsToLoad = metadata.years;

      for (const y of yearsToLoad) {
        try {
          const yearIndex = await loadYearIndex(y);
          const videoFiles = yearIndex.videos.map((v) => v.dataFile);
          const videos = await loadVideosData(videoFiles);

          const videosWithYear = videos.map((v: WWDCVideo) => ({
            ...v,
            year: y,
          }));
          allVideos.push(...videosWithYear);
        } catch (error) {
          logger.warn(`Failed to load year ${y}:`, error);
        }
      }
    }

    let filteredVideos = allVideos;

    // Topic filter (if not already filtered through topic index)
    if (topic && !byTopicIndex) {
      const topicLower = topic.toLowerCase();
      filteredVideos = filteredVideos.filter(
        (v) =>
          v.topics.some((t) => t.toLowerCase().includes(topicLower)) ||
          v.title.toLowerCase().includes(topicLower),
      );
    }

    if (hasCode !== undefined) {
      filteredVideos = filteredVideos.filter((v) => v.hasCode === hasCode);
    }

    const limitedVideos = filteredVideos.slice(0, limit);

    return formatVideoList(limitedVideos, year, topic, hasCode);
  } catch (error) {
    logger.error("Failed to list WWDC videos:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: Failed to list WWDC videos: ${errorMessage}`;
  }
}

/**
 * Format video list
 */
function formatVideoList(
  videos: Array<WWDCVideo & { year: string }>,
  year?: string,
  topic?: string,
  hasCode?: boolean,
): string {
  if (videos.length === 0) {
    return "No WWDC videos found matching the criteria.";
  }

  let content = "# WWDC Video List\n\n";

  const filters: string[] = [];
  if (year && year !== "all") {
    filters.push(`Year: ${year}`);
  }
  if (topic) {
    filters.push(`Topic: ${topic}`);
  }
  if (hasCode !== undefined) {
    filters.push(`Has Code: ${hasCode ? "Yes" : "No"}`);
  }

  if (filters.length > 0) {
    content += `**Filter Conditions:** ${filters.join(", ")}\n\n`;
  }

  content += `**Found ${videos.length} videos**\n\n`;

  const videosByYear = videos.reduce(
    (acc, video) => {
      const group = acc[video.year] ?? [];
      group.push(video);
      acc[video.year] = group;
      return acc;
    },
    {} as Record<string, typeof videos>,
  );

  Object.keys(videosByYear)
    .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
    .forEach((y) => {
      content += `## WWDC${y}\n\n`;

      (videosByYear[y] ?? []).forEach((video) => {
        content += `### [${video.title}](${video.url})\n`;

        const metadata: string[] = [];
        if (video.duration) {
          metadata.push(`Duration: ${video.duration}`);
        }
        if (video.speakers && video.speakers.length > 0) {
          metadata.push(`Speakers: ${video.speakers.join(", ")}`);
        }
        if (video.hasTranscript) {
          metadata.push("Transcript");
        }
        if (video.hasCode) {
          metadata.push("Code Examples");
        }

        if (metadata.length > 0) {
          content += `*${metadata.join(" | ")}*\n`;
        }

        if (video.topics.length > 0) {
          content += `**Topics:** ${video.topics.join(", ")}\n`;
        }

        content += "\n";
      });
    });

  return content;
}
