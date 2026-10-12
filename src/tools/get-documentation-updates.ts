import type {
  RenderIndex,
  RenderIndexNode,
  RenderNode,
} from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { generateUrlCacheKey, updatesCache } from "../utils/cache.ts";
import { APPLE_URLS } from "../utils/constants.ts";
import { httpClient } from "../utils/http-client.ts";
import { logger } from "../utils/logger.ts";
import { formatInlineContent } from "./doc-formatter.ts";

/**
 * Handle get documentation updates
 */
export async function handleGetDocumentationUpdates(
  category: string = "all",
  technology?: string,
  year?: string,
  searchQuery?: string,
  includeBeta: boolean = true,
  limit: number = 50,
): Promise<string> {
  try {
    logger.info("Fetching documentation updates...");

    // Generate cache key
    const cacheKey = generateUrlCacheKey("documentation-updates", {
      category,
      technology,
      year,
      searchQuery,
      includeBeta,
      limit,
    });

    // Try to get from cache first
    const cachedResult = updatesCache.get(cacheKey);
    if (cachedResult) {
      logger.debug("Updates cache hit");
      return cachedResult;
    }

    // Fetch both updates data files
    const [updatesData, updatesIndex] = await Promise.all([
      httpClient.getJson<RenderNode>(APPLE_URLS.UPDATES_JSON),
      httpClient.getJson<RenderIndex>(APPLE_URLS.UPDATES_INDEX_JSON),
    ]);

    // Parse and filter updates
    const updates = parseUpdates(updatesData, updatesIndex);
    const filteredUpdates = applyUpdatesFilters(updates, {
      category,
      technology,
      year,
      searchQuery,
      includeBeta,
      limit,
    });

    // Format output
    const result = formatUpdatesList(filteredUpdates);

    // Cache the result
    updatesCache.set(cacheKey, result);

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    logger.error("Error fetching documentation updates:", error);
    return `Error: Failed to fetch documentation updates: ${errorMessage}`;
  }
}

/**
 * Parse updates data
 */
function parseUpdates(updatesData: RenderNode, updatesIndex: RenderIndex) {
  const updates: UpdateItem[] = [];

  // Process main updates sections
  if (updatesData.topicSections) {
    updatesData.topicSections.forEach((section) => {
      const sectionCategory = getSectionCategory(section.title ?? "");

      section.identifiers.forEach((identifier) => {
        const reference = updatesData.references?.[identifier];
        if (isTopicReference(reference)) {
          // Apple files past WWDCs under "Past releases": an item named WWDC<year> is a WWDC whatever its section
          const category = /^WWDC\d{2,4}\b/.test(reference.title)
            ? "wwdc"
            : sectionCategory;
          const updateItem: UpdateItem = {
            title: reference.title,
            url: reference.url
              ? `https://developer.apple.com${reference.url}`
              : "",
            description: formatInlineContent(
              reference.abstract ?? [],
              updatesData.references,
            ).trim(),
            category,
            type: reference.kind,
            identifier,
            images: reference.images,
          };

          // Extract year from WWDC titles
          if (category === "wwdc") {
            const yearDigits = reference.title.match(/WWDC(\d{2,4})/)?.[1];
            if (yearDigits) {
              updateItem.year =
                yearDigits.length === 2 ? `20${yearDigits}` : yearDigits;
            }
          }

          updates.push(updateItem);
        }
      });
    });
  }

  // Process index data for additional details and beta information
  const swiftIndex = updatesIndex.interfaceLanguages?.["swift"];
  if (swiftIndex) {
    processIndexSection(swiftIndex, updates);
  }

  return updates;
}

/**
 * Process index section recursively
 */
function processIndexSection(
  sections: RenderIndexNode[],
  updates: UpdateItem[],
) {
  sections.forEach((section) => {
    // Find corresponding update item
    const matchingUpdate = updates.find(
      (u) =>
        (section.path && u.url.includes(section.path)) ||
        u.title === section.title,
    );

    if (matchingUpdate) {
      matchingUpdate.beta = section.beta ?? false;
      // A WWDC's page sits under /documentation/updates/ too, but names no technology
      if (matchingUpdate.category === "technology") {
        matchingUpdate.technology = extractTechnologyFromPath(
          section.path ?? "",
        );
      }
    }

    // Process children
    if (section.children) {
      processIndexSection(section.children, updates);
    }
  });
}

/**
 * Get section category
 */
function getSectionCategory(title: string): UpdateCategory {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("wwdc")) {
    return "wwdc";
  }
  if (lowerTitle.includes("release notes")) {
    return "release-notes";
  }
  if (lowerTitle.includes("technology")) {
    return "technology";
  }
  return "other";
}

/**
 * Extract technology from path
 */
function extractTechnologyFromPath(path: string): string | undefined {
  const match = path.match(/\/documentation\/updates\/([^/]+)/i);
  if (match?.[1]) {
    // Convert to proper case
    return match[1]
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return undefined;
}

/**
 * Apply filters to updates
 */
function applyUpdatesFilters(
  updates: UpdateItem[],
  filters: {
    category?: string | undefined;
    technology?: string | undefined;
    year?: string | undefined;
    searchQuery?: string | undefined;
    includeBeta?: boolean | undefined;
    limit?: number | undefined;
  },
): UpdateItem[] {
  let filtered = [...updates];

  // Category filter
  if (filters.category && filters.category !== "all") {
    filtered = filtered.filter(
      (update) => update.category === filters.category,
    );
  }

  // Technology filter
  if (filters.technology) {
    const techLower = filters.technology.toLowerCase();
    filtered = filtered.filter(
      (update) =>
        update.technology?.toLowerCase().includes(techLower) ||
        update.title.toLowerCase().includes(techLower) ||
        update.description.toLowerCase().includes(techLower),
    );
  }

  // Year filter (for WWDC)
  if (filters.year) {
    filtered = filtered.filter((update) => update.year === filters.year);
  }

  // Search query filter
  if (filters.searchQuery) {
    const queryLower = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (update) =>
        update.title.toLowerCase().includes(queryLower) ||
        update.description.toLowerCase().includes(queryLower),
    );
  }

  // Beta filter
  if (!filters.includeBeta) {
    filtered = filtered.filter((update) => !update.beta);
  }

  // Apply limit
  if (filters.limit && filters.limit > 0) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

/**
 * Format updates list
 */
function formatUpdatesList(updates: UpdateItem[]): string {
  if (updates.length === 0) {
    return "No documentation updates found matching the specified criteria.";
  }

  let content = "# Apple Developer Documentation Updates\n\n";

  // Group by category
  const grouped = updates.reduce(
    (acc, update) => {
      const category = update.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(update);
      return acc;
    },
    {} as Record<string, UpdateItem[]>,
  );

  // Format each category
  const categoryTitles: Record<string, string> = {
    wwdc: "WWDC",
    technology: "Technology Updates",
    "release-notes": "Release Notes",
    other: "Other Updates",
  };

  Object.entries(grouped).forEach(([category, items]) => {
    content += `## ${categoryTitles[category] ?? category}\n\n`;

    // Add WWDC-specific suggestion
    if (category === "wwdc" && items.length > 0) {
      content +=
        "> **💡 Tip:** For comprehensive WWDC video content with full transcripts and code examples, use the dedicated WWDC tools:\n";
      content +=
        "> - `list_wwdc_videos` - Browse videos by year, topic, or code availability\n";
      content +=
        "> - `search_wwdc_content` - Search through video transcripts and code\n";
      content +=
        "> - `browse_wwdc_topics` - Explore videos by topic categories\n\n";
    }

    items.forEach((item) => {
      // Build title with badges
      let titleLine = `### [${item.title}](${item.url})`;

      const badges = [];
      if (item.beta) {
        badges.push("Beta");
      }
      if (item.images?.some((img) => img.identifier === "new.svg")) {
        badges.push("New");
      }

      if (badges.length > 0) {
        titleLine += ` *${badges.join(" | ")}*`;
      }

      content += `${titleLine}\n`;

      // Add description
      if (item.description) {
        content += `${item.description}\n`;
      }

      // Add metadata
      const metadata = [];
      if (item.technology && item.category !== "technology") {
        metadata.push(`Technology: ${item.technology}`);
      }
      if (item.year && item.category === "wwdc") {
        metadata.push(`Year: ${item.year}`);
      }

      if (metadata.length > 0) {
        content += `*${metadata.join(" | ")}*\n`;
      }

      content += "\n";
    });
  });

  content +=
    "\n---\n\n[View all updates on Apple Developer](https://developer.apple.com/documentation/updates)";

  return content;
}

/**
 * Update item interface
 */
interface UpdateItem {
  title: string;
  url: string;
  description: string;
  category: UpdateCategory;
  type: string;
  identifier: string;
  technology?: string | undefined;
  year?: string | undefined;
  beta?: boolean | undefined;
  images?: Array<{ type: string; identifier: string }> | undefined;
}

type UpdateCategory = "wwdc" | "technology" | "release-notes" | "other";
