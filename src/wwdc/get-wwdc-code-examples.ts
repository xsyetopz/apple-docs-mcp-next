/**
 * Code examples from the bundled WWDC sessions
 */
import { logger } from "../core/logger.ts";
import {
  loadGlobalMetadata,
  loadTopicIndex,
  loadYearIndex,
} from "./data-source.ts";
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

  return formatCodeExamples(limitedExamples, framework, topic, year, language);
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
  framework?: string,
  topic?: string,
  year?: string,
  language?: string,
): string => {
  if (examples.length === 0) {
    return "No code examples found matching the criteria.";
  }

  let content = "# WWDC Code Examples\n\n";

  const filters: string[] = [];
  if (framework) {
    filters.push(`Framework: ${framework}`);
  }
  if (topic) {
    filters.push(`Topic: ${topic}`);
  }
  if (year) {
    filters.push(`Year: ${year}`);
  }
  if (language) {
    filters.push(`Language: ${language}`);
  }

  if (filters.length > 0) {
    content += `**Filter Conditions:** ${filters.join(", ")}\n\n`;
  }

  content += `**Found ${examples.length} code examples**\n\n`;

  const examplesByLanguage = examples.reduce(
    (acc, ex) => {
      const group = acc[ex.language] ?? [];
      group.push(ex);
      acc[ex.language] = group;
      return acc;
    },
    {} as Record<string, typeof examples>,
  );

  Object.keys(examplesByLanguage).forEach((lang) => {
    content += `## ${lang.charAt(0).toUpperCase() + lang.slice(1)}\n\n`;

    (examplesByLanguage[lang] ?? []).forEach((example) => {
      content += `### ${example.title || "Code Example"}\n`;
      content += `*From: [${example.videoTitle}](${example.videoUrl}) (WWDC${example.year})*`;

      if (example.timestamp) {
        content += ` *@ ${example.timestamp}*`;
      }
      content += "\n\n";

      content += `\`\`\`${example.language}\n`;
      content += example.code;
      content += "\n```\n\n";
    });
  });

  return content;
};
