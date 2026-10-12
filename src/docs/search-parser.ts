import { API_LIMITS } from "../core/constants.ts";
import { logger } from "../core/logger.ts";
import type { SearchDocument } from "../types/captured/search-document.ts";
import type { SearchStream } from "../types/captured/search-stream.ts";
import type { ApiSearchResult, SearchResult } from "./search-result-parser.ts";
import { parseSearchResult } from "./search-result-parser.ts";

/**
 * Formats search results for display
 */
export function formatSearchResults(
  results: SearchResult[],
  query: string,
  filterType: string,
  searchUrl: string,
): string {
  let content = "";

  // Add header
  content += "# Apple Documentation Search Results\n\n";
  content += `**Query:** "${query}"\n`;
  content += `**Filter:** ${filterType}\n`;
  content += `**Results found:** ${results.length}\n\n`;

  // Check if query might be video-related
  const videoSuggestion = getVideoSuggestion(query);
  if (videoSuggestion) {
    content += videoSuggestion;
  }

  if (results.length === 0) {
    content += formatNoResultsMessage(query, filterType, searchUrl);
    return content;
  }

  // Group results by type
  const groupedResults = groupResultsByType(results);

  // Format each group
  Object.entries(groupedResults).forEach(([type, typeResults]) => {
    content += formatResultGroup(type, typeResults);
  });

  // Add footer
  content += formatSearchFooter(searchUrl);

  return content;
}

/**
 * Format no results message
 */
function formatNoResultsMessage(
  query: string,
  filterType: string,
  searchUrl: string,
): string {
  let content = "## No Results Found\n\n";
  content += `No ${filterType === "all" ? "" : `${filterType} `}results found for "${query}".\n\n`;
  content += "### Suggestions:\n";
  content += "- Try using different keywords\n";
  content += "- Check spelling\n";
  content += "- Use more general terms\n";
  content += '- Try searching for framework names (e.g., "SwiftUI", "UIKit")\n';

  // Add video-specific suggestion if applicable
  const videoSuggestion = getVideoSuggestion(query);
  if (videoSuggestion) {
    content += "- For WWDC videos, use the dedicated WWDC tools\n";
  }

  content += `\n[View search on Apple Developer](${searchUrl})`;
  return content;
}

/**
 * Group results by type
 */
function groupResultsByType(
  results: SearchResult[],
): Record<string, SearchResult[]> {
  const groups: Record<string, SearchResult[]> = {};

  results.forEach((result) => {
    const displayType = getDisplayType(result.type);
    if (!groups[displayType]) {
      groups[displayType] = [];
    }
    groups[displayType].push(result);
  });

  return groups;
}

/**
 * Get display type for result
 */
function getDisplayType(type: string): string {
  const typeDisplayNames: Record<string, string> = {
    documentation: "📚 API Documentation",
    "documentation-article": "📄 Articles",
    "documentation-tutorial": "📖 Tutorials",
    "sample-code": "💻 Sample Code",
    "design-guideline": "🎨 Design Guidelines",
    "wwdc-session": "🎥 WWDC Sessions",
    help: "🧭 App Store Connect Help",
    guide: "📋 Guides",
  };

  return typeDisplayNames[type] || "📝 Other";
}

/**
 * Format a group of results
 */
function formatResultGroup(type: string, results: SearchResult[]): string {
  let content = `## ${type}\n\n`;

  results.forEach((result, index) => {
    content += formatSingleResult(result, index + 1);
  });

  return content;
}

/**
 * Format a single search result
 */
function formatSingleResult(result: SearchResult, index: number): string {
  let content = `### ${index}. ${result.title}`;

  // Add badges
  const badges = [];
  if (result.beta) {
    badges.push("🧪 Beta");
  }
  if (badges.length > 0) {
    content += ` ${badges.join(" ")}`;
  }

  content += "\n\n";

  // Add metadata
  if (result.framework) {
    content += `**Framework:** ${result.framework}\n`;
  }
  content += `**Type:** ${result.type.replace(/-/g, " ")}\n`;

  // Add description
  if (result.description) {
    content += `**Description:** ${result.description}\n`;
  }

  if (result.wwdc) {
    content += `**Read:** get_wwdc_video (year: "${result.wwdc.year}", videoId: "${result.wwdc.videoId}"): transcript and code\n`;
  }

  // Add URL
  content += `**URL:** ${result.url}\n\n`;

  return content;
}

/**
 * Format search footer
 */
function formatSearchFooter(searchUrl: string): string {
  return `---\n\n[View all results on Apple Developer](${searchUrl})`;
}

/**
 * Check if query might be video-related and provide WWDC tool suggestions
 */
function getVideoSuggestion(query: string): string | null {
  const videoKeywords = [
    "video",
    "wwdc",
    "session",
    "presentation",
    "talk",
    "keynote",
    "demo",
    "tutorial",
    "walkthrough",
    "overview",
    "introduction",
    "deep dive",
    "best practices",
    "tips",
    "tricks",
  ];

  const queryLower = query.toLowerCase();
  const hasVideoKeyword = videoKeywords.some((keyword) =>
    queryLower.includes(keyword),
  );

  // Also check for year patterns (e.g., "2024", "2025", "wwdc24")
  const hasYearPattern = /\b(20[2-9][0-9]|wwdc[2-9][0-9])\b/i.test(query);

  if (hasVideoKeyword || hasYearPattern) {
    return `## 💡 Looking for WWDC Videos?

This search covers documentation and samples, but not WWDC videos. For WWDC content, try these tools:

- **\`list_wwdc_videos\`** - Browse WWDC videos by year, topic, or code availability
- **\`search_wwdc_content\`** - Search through video transcripts and code examples
- **\`browse_wwdc_topics\`** - Explore videos organized by topic categories

---

`;
  }

  return null;
}

/**
 * Replays the JSON lines Apple's search API streams, as its search page does: each `search` event takes `removeLast`
 * characters off the results document, then appends `append`
 */
export function streamedDocument(jsonl: string): string {
  let document = "";
  for (const line of jsonl.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const event = JSON.parse(line) as SearchStream;
    if (event.kind === "search") {
      const { append = "", removeLast = 0 } = event.diff ?? {};
      document =
        document.slice(0, Math.max(0, document.length - removeLast)) + append;
    }
  }
  return document;
}

function streamedResults(jsonl: string): ApiSearchResult[] {
  const document = streamedDocument(jsonl);
  return document ? (JSON.parse(document) as SearchDocument).results : [];
}

/**
 * The results of one or more searches (`all` sends two), in order and each page once, WWDC sessions capped at
 * `MAX_WWDC_RESULTS`
 */
export function parseSearchResults(
  streams: string[],
  query: string,
  searchUrl: string,
  filterType: string,
): string {
  try {
    const found = streams
      .flatMap(streamedResults)
      .map((result) => parseSearchResult(result, filterType))
      .filter((result): result is SearchResult => result !== null);
    const parsed = found.filter(
      (result, index) =>
        found.findIndex((other) => other.url === result.url) === index,
    );
    const sessions = parsed
      .filter((result) => result.type === "wwdc-session")
      .slice(0, API_LIMITS.MAX_WWDC_RESULTS);
    const results = parsed
      .filter(
        (result) => result.type !== "wwdc-session" || sessions.includes(result),
      )
      .slice(0, API_LIMITS.MAX_SEARCH_RESULTS);

    return formatSearchResults(results, query, filterType, searchUrl);
  } catch (error) {
    logger.error("Error parsing search results:", error);
    return `Error parsing search results: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
