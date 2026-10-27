/**
 * WWDC sessions by year, topic and code, from the bundled data
 */
import { logger } from "../core/logger.ts";
import {
  loadGlobalMetadata,
  loadTopicIndex,
  loadYearIndex,
} from "./data-source.ts";
import { sessionLine } from "./format.ts";
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
export const handleListWWDCVideos = async ({
  year,
  topic,
  hasCode,
  limit,
}: VideoListQuery): Promise<string> => {
  if (year === undefined && topic === undefined && hasCode === undefined) {
    return formatIndex();
  }

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

  // Newest first, so a cap drops the oldest
  filteredVideos.sort((a, b) => parseInt(b.year, 10) - parseInt(a.year, 10));
  const limitedVideos = filteredVideos.slice(0, limit);

  if (limitedVideos.length === 0 && topic && !isTopicId) {
    return `No WWDC videos found matching the criteria. Topic IDs: ${metadata.topics.map((t) => topicLabel(t)).join(", ")}`;
  }

  return formatVideoList(limitedVideos, filteredVideos.length, year, topic);
};

/**
 * Format video list
 */
const formatVideoList = (
  videos: Array<WWDCVideo & { year: string }>,
  total: number,
  year?: string,
  topic?: string,
): string => {
  if (videos.length === 0) {
    return "No WWDC videos found matching the criteria.";
  }

  const spansYears = !year || year === "all";
  const lines = videos.map((video) =>
    sessionLine(video, { showYear: spansYears, showTopics: !topic }),
  );

  let content = `# WWDC sessions\n\n${videos.length} of ${total} sessions\n\n${lines.join("\n")}\n`;
  if (total > videos.length) {
    content += `\nShowing ${videos.length} of ${total}. Narrow with year or topic, or raise limit.\n`;
  }
  return content;
};

/**
 * A topic as its ID with its display name, and its session count when given
 */
const topicLabel = (
  topic: { id: string; name: string },
  count?: number,
): string =>
  `${topic.id} (${topic.name}${count === undefined ? "" : `, ${count}`})`;

/**
 * The index: years, totals and topics with their IDs
 */
const formatIndex = async (): Promise<string> => {
  const metadata = await loadGlobalMetadata();
  const stats = metadata.statistics;
  const years = [...(metadata.years ?? [])].sort((a, b) => b.localeCompare(a));
  if (years.length === 0) {
    return "No WWDC years available.";
  }

  const yearList = years
    .map((y) => `${y} (${stats?.byYear?.[y] ?? 0})`)
    .join(", ");
  const topicList = metadata.topics
    .map((t) => topicLabel(t, stats?.byTopic?.[t.id] ?? 0))
    .join(", ");

  return [
    "# WWDC sessions",
    "",
    `Years: ${yearList}`,
    `Total: ${metadata.totalVideos || 0} sessions, ${stats?.videosWithCode ?? 0} with code, ${stats?.videosWithTranscript ?? 0} with transcript`,
    `Topics (id): ${topicList}`,
    "",
    "Pass year, topic (a topic ID or a word) or hasCode to list sessions.",
    "",
  ].join("\n");
};
