/**
 * Code examples from the bundled WWDC sessions
 */
import { logger } from "../core/logger.ts";
import {
  loadGlobalMetadata,
  loadTopicIndex,
  loadYearIndex,
} from "./data-source.ts";
import { tidyCode } from "./format.ts";
import { loadVideosData } from "./load-videos.ts";

export interface CodeExamplesQuery {
  framework?: string | undefined;
  topic?: string | undefined;
  year?: string | undefined;
  language?: string | undefined;
  limit: number;
}

/**
 * Get WWDC code examples
 */
export const handleGetWWDCCodeExamples = async ({
  framework,
  topic,
  year,
  language,
  limit,
}: CodeExamplesQuery): Promise<string> => {
  const metadata = await loadGlobalMetadata();
  const codeExamples: Array<{
    code: string;
    language: string;
    title?: string | undefined;
    timestamp?: string | undefined;
    videoTitle: string;
    videoUrl: string;
    year: string;
  }> = [];

  const yearsToSearch = year ? [year] : metadata.years;
  const isTopicId = metadata.topics.some((t) => t.id === topic);

  for (const y of yearsToSearch) {
    try {
      const yearIndex = await loadYearIndex(y);

      const videosWithCode = yearIndex.videos.filter((v) => v.hasCode);

      let filteredVideos = videosWithCode;
      if (topic) {
        if (isTopicId) {
          try {
            const topicIndex = await loadTopicIndex(topic);
            const topicVideoIds = new Set(topicIndex.videos.map((v) => v.id));
            filteredVideos = videosWithCode.filter((v) =>
              topicVideoIds.has(v.id),
            );
          } catch (error) {
            logger.warn("No topic index, matching topic names instead", {
              topic,
              error,
            });
            const topicLower = topic.toLowerCase();
            filteredVideos = videosWithCode.filter(
              (v) =>
                v.topics.some((t) => t.toLowerCase().includes(topicLower)) ||
                v.title.toLowerCase().includes(topicLower),
            );
          }
        } else {
          const topicLower = topic.toLowerCase();
          filteredVideos = videosWithCode.filter(
            (v) =>
              v.topics.some((t) => t.toLowerCase().includes(topicLower)) ||
              v.title.toLowerCase().includes(topicLower),
          );
        }
      }

      if (filteredVideos.length === 0) {
        continue;
      }

      const videoFiles = filteredVideos.map((v) => v.dataFile);
      const videos = await loadVideosData(videoFiles);

      for (const video of videos) {
        if (!video.codeExamples || video.codeExamples.length === 0) {
          continue;
        }

        for (const example of video.codeExamples) {
          if (
            language &&
            example.language.toLowerCase() !== language.toLowerCase()
          ) {
            continue;
          }

          if (
            framework &&
            !example.code.toLowerCase().includes(framework.toLowerCase())
          ) {
            continue;
          }

          codeExamples.push({
            code: example.code,
            language: example.language,
            title: example.title,
            timestamp: example.timestamp,
            videoTitle: video.title,
            videoUrl: video.url,
            year: y,
          });
        }
      }
    } catch (error) {
      logger.warn(`Failed to search code examples for year ${y}:`, error);
    }
  }

  const limitedExamples = codeExamples.slice(0, limit);

  return formatCodeExamples(limitedExamples, codeExamples.length);
};

/**
 * Format code examples
 */
const formatCodeExamples = (
  examples: Array<{
    code: string;
    language: string;
    title?: string | undefined;
    timestamp?: string | undefined;
    videoTitle: string;
    videoUrl: string;
    year: string;
  }>,
  total: number,
): string => {
  if (examples.length === 0) {
    return "No code examples found matching the criteria.";
  }

  let content = `${examples.length} of ${total} code examples\n\n`;

  for (const example of examples) {
    const title = example.title || "Code Example";
    const at = example.timestamp ? ` @ ${example.timestamp}` : "";
    content += `### ${title} · [${example.videoTitle}](${example.videoUrl}) · ${example.year}${at}\n`;
    content += `\`\`\`${example.language}\n${tidyCode(example.code, example.title)}\n\`\`\`\n\n`;
  }

  if (total > examples.length) {
    content += `Showing ${examples.length} of ${total}. Narrow with year, topic or language, or raise limit.\n`;
  }

  return content;
};
