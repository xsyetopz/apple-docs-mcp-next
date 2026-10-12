/**
 * WWDC Video MCP Tool Handlers
 */

import { logger } from "../core/logger.ts";
import {
  loadGlobalMetadata,
  loadTopicIndex,
  loadVideoData,
  loadYearIndex,
} from "./data-source.ts";
import type { WWDCVideo } from "./types.ts";

/**
 * Helper function to load multiple video data files
 */
async function loadVideosData(videoFiles: string[]): Promise<WWDCVideo[]> {
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
}

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

export interface ContentSearchQuery {
  query: string;
  searchIn: "transcript" | "code" | "both";
  year?: string | undefined;
  language?: string | undefined;
  limit: number;
}

/**
 * Search WWDC content
 */
export async function handleSearchWWDCContent({
  query,
  searchIn,
  year,
  language,
  limit,
}: ContentSearchQuery): Promise<string> {
  try {
    const metadata = await loadGlobalMetadata();
    const queryLower = query.toLowerCase();
    const results: Array<{
      video: WWDCVideo & { year: string };
      matches: Array<{
        type: "transcript" | "code";
        context: string;
        timestamp?: string | undefined;
      }>;
    }> = [];

    const yearsToSearch = year ? [year] : metadata.years;

    for (const y of yearsToSearch) {
      try {
        const yearIndex = await loadYearIndex(y);

        // Pre-filter: only load videos that might contain search content
        const potentialVideos = yearIndex.videos.filter((v) => {
          const titleMatch =
            v.title?.toLowerCase().includes(queryLower) || false;
          const topicMatch =
            v.topics?.some((t) => t.toLowerCase().includes(queryLower)) ||
            false;
          return (
            titleMatch ||
            topicMatch ||
            ((searchIn === "code" || searchIn === "both") && v.hasCode) ||
            ((searchIn === "transcript" || searchIn === "both") &&
              v.hasTranscript)
          );
        });

        if (potentialVideos.length === 0) {
          continue;
        }

        const videoFiles = potentialVideos.map((v) => v.dataFile);
        const videos = await loadVideosData(videoFiles);

        for (const video of videos) {
          const matches: Array<{
            type: "transcript" | "code";
            context: string;
            timestamp?: string | undefined;
          }> = [];

          if (
            (searchIn === "transcript" || searchIn === "both") &&
            video.transcript
          ) {
            const transcriptMatches = searchInTranscript(
              video.transcript.fullText,
              queryLower,
            );
            matches.push(
              ...transcriptMatches.map((m) => ({
                type: "transcript" as const,
                context: m.context,
                timestamp: m.timestamp,
              })),
            );
          }

          if (
            (searchIn === "code" || searchIn === "both") &&
            video.codeExamples
          ) {
            const codeMatches = searchInCode(
              video.codeExamples,
              queryLower,
              language,
            );
            matches.push(
              ...codeMatches.map((m) => ({
                type: "code" as const,
                context: m.context,
                timestamp: m.timestamp,
              })),
            );
          }

          if (matches.length > 0) {
            results.push({
              video: { ...video, year: y },
              matches: matches.slice(0, 3), // Max 3 matches per video
            });
          }
        }
      } catch (error) {
        logger.warn(`Failed to search year ${y}:`, error);
      }
    }

    results.sort((a, b) => b.matches.length - a.matches.length);

    const limitedResults = results.slice(0, limit);

    return formatSearchResults(limitedResults, query, searchIn);
  } catch (error) {
    logger.error("Failed to search WWDC content:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: Failed to search WWDC content: ${errorMessage}`;
  }
}

export interface VideoQuery {
  year: string;
  videoId: string;
  includeTranscript: boolean;
  includeCode: boolean;
}

/**
 * Get WWDC video details
 */
export async function handleGetWWDCVideo({
  year,
  videoId,
  includeTranscript,
  includeCode,
}: VideoQuery): Promise<string> {
  try {
    const video = await loadVideoData(year, videoId);

    return formatVideoDetail(video, includeTranscript, includeCode);
  } catch (error) {
    logger.error("Failed to get WWDC video:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: Failed to get WWDC video: ${errorMessage}`;
  }
}

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
export async function handleGetWWDCCodeExamples({
  framework,
  topic,
  year,
  language,
  limit,
}: CodeExamplesQuery): Promise<string> {
  try {
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

    return formatCodeExamples(
      limitedExamples,
      framework,
      topic,
      year,
      language,
    );
  } catch (error) {
    logger.error("Failed to get WWDC code examples:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: Failed to get WWDC code examples: ${errorMessage}`;
  }
}

/**
 * Search in transcript
 */
function searchInTranscript(
  fullText: string,
  query: string,
): Array<{ context: string; timestamp?: string | undefined }> {
  const matches: Array<{ context: string; timestamp?: string | undefined }> =
    [];
  const lines = fullText.split("\n");

  for (const [i, line] of lines.entries()) {
    if (line.toLowerCase().includes(query)) {
      const context = [lines[i - 1] ?? "", line, lines[i + 1] ?? ""]
        .filter((l) => l.trim())
        .join(" ... ");

      matches.push({ context });
    }
  }

  return matches;
}

/**
 * Search in code
 */
function searchInCode(
  codeExamples: Array<{
    code: string;
    language: string;
    timestamp?: string | undefined;
    title?: string | undefined;
  }>,
  query: string,
  language?: string,
): Array<{ context: string; timestamp?: string | undefined }> {
  const matches: Array<{ context: string; timestamp?: string | undefined }> =
    [];

  for (const example of codeExamples) {
    if (language && example.language.toLowerCase() !== language.toLowerCase()) {
      continue;
    }

    const lines = example.code.split("\n");
    const at = lines.findIndex((line) => line.toLowerCase().includes(query));
    if (at >= 0) {
      // The matching line with 2 lines before it and 6 after: enough to see the call and what it takes
      const snippet = lines.slice(Math.max(0, at - 2), at + 7).join("\n");
      matches.push({
        context: `${example.title ?? ""}\n\`\`\`${example.language}\n${snippet}\n\`\`\``,
        timestamp: example.timestamp,
      });
    }
  }

  return matches;
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

/**
 * Format search results
 */
function formatSearchResults(
  results: Array<{
    video: WWDCVideo & { year: string };
    matches: Array<{
      type: "transcript" | "code";
      context: string;
      timestamp?: string | undefined;
    }>;
  }>,
  query: string,
  searchIn: string,
): string {
  if (results.length === 0) {
    return `No ${searchIn === "code" ? "code" : searchIn === "transcript" ? "transcript" : "content"} found containing "${query}".`;
  }

  let content = "# WWDC Content Search Results\n\n";
  content += `**Search Query:** "${query}"\n`;
  content += `**Search Scope:** ${searchIn === "code" ? "Code" : searchIn === "transcript" ? "Transcript" : "All Content"}\n`;
  content += `**Found ${results.length} related videos**\n\n`;

  results.forEach((result) => {
    content += `## [${result.video.title}](${result.video.url})\n`;
    content += `*WWDC${result.video.year} | ${result.matches.length} matches*\n\n`;

    result.matches.forEach((match) => {
      content += `**${match.type === "code" ? "Code" : "Transcript"}**`;
      if (match.timestamp) {
        content += ` (${match.timestamp})`;
      }
      content += "\n";
      content +=
        match.type === "code"
          ? `${match.context}\n\n`
          : `> ${match.context}\n\n`;
    });
  });

  return content;
}

/**
 * Format video details
 */
function formatVideoDetail(
  video: WWDCVideo,
  includeTranscript: boolean,
  includeCode: boolean,
): string {
  let content = `# ${video.title}\n\n`;
  content += `**WWDC${video.year}** | [Watch Video](${video.url})\n\n`;

  if (video.duration) {
    content += `**Duration:** ${video.duration}\n`;
  }
  if (video.speakers && video.speakers.length > 0) {
    content += `**Speakers:** ${video.speakers.join(", ")}\n`;
  }
  if (video.topics.length > 0) {
    content += `**Topics:** ${video.topics.join(", ")}\n`;
  }

  if (
    video.resources.hdVideo ||
    video.resources.sdVideo ||
    video.resources.resourceLinks
  ) {
    content += "\n**Resources:**\n";
    if (video.resources.hdVideo) {
      content += `- [HD Video](${video.resources.hdVideo})\n`;
    }
    if (video.resources.sdVideo) {
      content += `- [SD Video](${video.resources.sdVideo})\n`;
    }
    if (
      video.resources.resourceLinks &&
      video.resources.resourceLinks.length > 0
    ) {
      video.resources.resourceLinks.forEach((link) => {
        content += `- [${link.title}](${link.url})\n`;
      });
    }
  }

  if (video.chapters && video.chapters.length > 0) {
    content += "\n## Chapters\n\n";
    video.chapters.forEach((chapter) => {
      content += `- **${chapter.timestamp}** ${chapter.title}\n`;
    });
  }

  if (includeTranscript && video.transcript) {
    content += "\n## Transcript\n\n";

    if (video.transcript.segments.length > 0) {
      video.transcript.segments.forEach((segment) => {
        content += `**${segment.timestamp}**\n`;
        content += `${segment.text}\n\n`;
      });
    } else {
      content += video.transcript.fullText;
    }
  }

  if (includeCode && video.codeExamples && video.codeExamples.length > 0) {
    content += "\n## Code Examples\n\n";

    video.codeExamples.forEach((example, index) => {
      if (example.title) {
        content += `### ${example.title}`;
      } else {
        content += `### Code Example ${index + 1}`;
      }

      if (example.timestamp) {
        content += ` (${example.timestamp})`;
      }
      content += "\n\n";

      content += `\`\`\`${example.language}\n`;
      content += example.code;
      content += "\n```\n\n";

      if (example.context) {
        content += `*${example.context}*\n\n`;
      }
    });
  }

  if (video.relatedVideos && video.relatedVideos.length > 0) {
    content += "\n## Related Videos\n\n";
    video.relatedVideos.forEach((related) => {
      content += `- [${related.title}](${related.url}) (WWDC${related.year})\n`;
    });
  }

  return content;
}

/**
 * Format code examples
 */
function formatCodeExamples(
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
): string {
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
}

export interface TopicsQuery {
  topicId?: string | undefined;
  includeVideos: boolean;
  year?: string | undefined;
  limit: number;
}

/**
 * Browse WWDC topics
 */
export async function handleBrowseWWDCTopics({
  topicId,
  includeVideos,
  year,
  limit,
}: TopicsQuery): Promise<string> {
  try {
    const metadata = await loadGlobalMetadata();

    if (!topicId) {
      let content = "# WWDC Topics\n\n";
      content += `Found ${metadata.topics.length} topics:\n\n`;

      metadata.topics.forEach((topic) => {
        content += `## [${topic.name}](${topic.url})\n`;
        content += `**Topic ID:** ${topic.id}\n`;

        const topicStats = metadata.statistics.byTopic[topic.id];
        if (topicStats) {
          content += `**Videos:** ${topicStats}\n`;
        }

        content += "\n";
      });

      return content;
    }

    const topic = metadata.topics.find((t) => t.id === topicId);
    if (!topic) {
      return `Topic "${topicId}" not found. Available topics: ${metadata.topics.map((t) => t.id).join(", ")}`;
    }

    let content = `# ${topic.name}\n\n`;
    content += `**Topic ID:** ${topic.id}\n`;
    content += `**URL:** [${topic.url}](${topic.url})\n\n`;

    if (includeVideos) {
      try {
        const topicIndex = await loadTopicIndex(topicId);

        let videosToShow = topicIndex.videos;
        if (year && year !== "all") {
          videosToShow = videosToShow.filter((v) => v.year === year);
        }

        videosToShow = videosToShow.slice(0, limit);

        content += `## Videos (${videosToShow.length}${videosToShow.length === limit ? "+" : ""})\n\n`;

        if (videosToShow.length === 0) {
          content += "No videos found for this topic.\n";
        } else {
          const videosByYear = videosToShow.reduce(
            (acc, video) => {
              const group = acc[video.year] ?? [];
              group.push(video);
              acc[video.year] = group;
              return acc;
            },
            {} as Record<string, typeof videosToShow>,
          );

          Object.keys(videosByYear)
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
            .forEach((y) => {
              content += `### WWDC${y}\n\n`;

              (videosByYear[y] ?? []).forEach((video) => {
                content += `- [${video.title}](${video.url})`;

                const features: string[] = [];
                if (video.hasTranscript) {
                  features.push("Transcript");
                }
                if (video.hasCode) {
                  features.push("Code");
                }

                if (features.length > 0) {
                  content += ` | ${features.join(" | ")}`;
                }

                content += "\n";
              });

              content += "\n";
            });
        }
      } catch (error) {
        content += `Error loading videos for topic: ${error instanceof Error ? error.message : String(error)}\n`;
      }
    }

    return content;
  } catch (error) {
    logger.error("Failed to browse WWDC topics:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: Failed to browse WWDC topics: ${errorMessage}`;
  }
}

export interface RelatedVideosQuery {
  videoId: string;
  year: string;
  includeExplicitRelated: boolean;
  includeTopicRelated: boolean;
  includeYearRelated: boolean;
  limit: number;
}

/**
 * Find related WWDC videos
 */
export async function handleFindRelatedWWDCVideos({
  videoId,
  year,
  includeExplicitRelated,
  includeTopicRelated,
  includeYearRelated,
  limit,
}: RelatedVideosQuery): Promise<string> {
  try {
    const sourceVideo = await loadVideoData(year, videoId);

    let content = `# Related Videos for "${sourceVideo.title}"\n\n`;
    content += `**Source:** [${sourceVideo.title}](${sourceVideo.url}) (WWDC${year})\n\n`;

    const relatedVideos: Array<{
      video: WWDCVideo & { year: string };
      relationship: string;
      score: number;
    }> = [];

    if (includeExplicitRelated && sourceVideo.relatedVideos) {
      for (const related of sourceVideo.relatedVideos) {
        try {
          const relatedVideo = await loadVideoData(related.year, related.id);

          relatedVideos.push({
            video: { ...relatedVideo, year: related.year },
            relationship: "Explicitly related",
            score: 10,
          });
        } catch (error) {
          logger.warn(
            `Failed to load related video ${related.year}-${related.id}:`,
            error,
          );
        }
      }
    }

    if (
      includeTopicRelated &&
      sourceVideo.topics &&
      sourceVideo.topics.length > 0
    ) {
      for (const topic of sourceVideo.topics) {
        try {
          const metadata = await loadGlobalMetadata();
          const topicEntry = metadata.topics.find(
            (t) =>
              t.name.toLowerCase() === topic.toLowerCase() ||
              t.id
                .toLowerCase()
                .includes(topic.toLowerCase().replace(/\s+/g, "-")),
          );

          if (topicEntry) {
            const topicIndex = await loadTopicIndex(topicEntry.id);

            const topicVideos = topicIndex.videos.filter(
              (v) => v.id !== videoId,
            );

            const videoFiles = topicVideos.slice(0, 10).map((v) => v.dataFile); // Limit to avoid too many requests
            const videos = await loadVideosData(videoFiles);

            for (const video of videos) {
              if (
                relatedVideos.find(
                  (r) => r.video.id === video.id && r.video.year === video.year,
                )
              ) {
                continue;
              }

              const sharedTopics = (sourceVideo.topics || []).filter(
                (t) =>
                  video.topics?.some(
                    (vt) => vt.toLowerCase() === t.toLowerCase(),
                  ) || false,
              );
              const score = sharedTopics.length * 2;

              relatedVideos.push({
                video: { ...video, year: video.year },
                relationship: `Same topic: ${topicEntry.name}`,
                score,
              });
            }
          }
        } catch (error) {
          logger.warn(
            `Failed to find topic-related videos for topic ${topic}:`,
            error,
          );
        }
      }
    }

    if (includeYearRelated) {
      try {
        const yearIndex = await loadYearIndex(year);

        const yearVideos = yearIndex.videos.filter(
          (v) =>
            v.id !== videoId &&
            v.topics.some(
              (t) =>
                sourceVideo.topics?.some(
                  (st) => st.toLowerCase() === t.toLowerCase(),
                ) || false,
            ),
        );

        const videoFiles = yearVideos.slice(0, 10).map((v) => v.dataFile);
        const videos = await loadVideosData(videoFiles);

        for (const video of videos) {
          if (
            relatedVideos.find(
              (r) => r.video.id === video.id && r.video.year === video.year,
            )
          ) {
            continue;
          }

          const sharedTopics = (sourceVideo.topics || []).filter(
            (t) =>
              video.topics?.some(
                (vt) => vt.toLowerCase() === t.toLowerCase(),
              ) || false,
          );
          const score = sharedTopics.length;

          relatedVideos.push({
            video: { ...video, year: video.year },
            relationship: `Same year, shared topics: ${sharedTopics.join(", ")}`,
            score,
          });
        }
      } catch (error) {
        logger.warn("Failed to find year-related videos:", error);
      }
    }

    relatedVideos.sort((a, b) => b.score - a.score);
    const limitedResults = relatedVideos.slice(0, limit);

    if (limitedResults.length === 0) {
      content += "No related videos found.\n";
    } else {
      content += `## Related Videos (${limitedResults.length})\n\n`;

      limitedResults.forEach((result) => {
        content += `### [${result.video.title}](${result.video.url})\n`;
        content += `*WWDC${result.video.year} | ${result.relationship}*\n\n`;

        const features: string[] = [];
        if (result.video.duration) {
          features.push(`Duration: ${result.video.duration}`);
        }
        if (result.video.hasTranscript) {
          features.push("Transcript");
        }
        if (result.video.hasCode) {
          features.push("Code");
        }

        if (features.length > 0) {
          content += `${features.join(" | ")}\n`;
        }

        if (result.video.topics.length > 0) {
          content += `**Topics:** ${result.video.topics.join(", ")}\n`;
        }

        content += "\n";
      });
    }

    return content;
  } catch (error) {
    logger.error("Failed to find related WWDC videos:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: Failed to find related WWDC videos: ${errorMessage}`;
  }
}

/**
 * List all available WWDC years
 */
export async function handleListWWDCYears(): Promise<string> {
  try {
    const metadata = await loadGlobalMetadata();

    let content = "# Available WWDC Years\n\n";

    if (!metadata.years || metadata.years.length === 0) {
      return "No WWDC years available.";
    }

    const sortedYears = [...metadata.years].sort((a, b) => b.localeCompare(a));

    content += `**Total Years:** ${sortedYears.length}\n\n`;
    content += "## Years with Video Counts\n\n";

    for (const year of sortedYears) {
      const videoCount = metadata.statistics?.byYear?.[year] || 0;
      content += `- **${year}**: ${videoCount} videos\n`;
    }

    content += `\n**Total Videos:** ${metadata.totalVideos || 0}\n`;

    if (metadata.statistics) {
      content += "\n## Statistics\n\n";
      content += `- **Videos with Code:** ${metadata.statistics.videosWithCode || 0}\n`;
      content += `- **Videos with Transcript:** ${metadata.statistics.videosWithTranscript || 0}\n`;
    }

    return content;
  } catch (error) {
    logger.error("Failed to list WWDC years:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: Failed to list WWDC years: ${errorMessage}`;
  }
}
