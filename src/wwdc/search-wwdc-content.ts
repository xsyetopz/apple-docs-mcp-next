/**
 * Full-text search of the bundled WWDC transcripts and code
 */
import { logger } from "../core/logger.ts";
import { loadGlobalMetadata, loadYearIndex } from "./data-source.ts";
import { loadVideosData } from "./load-videos.ts";
import type { WWDCVideo } from "./types.ts";

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
        const titleMatch = v.title?.toLowerCase().includes(queryLower) || false;
        const topicMatch =
          v.topics?.some((t) => t.toLowerCase().includes(queryLower)) || false;
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
