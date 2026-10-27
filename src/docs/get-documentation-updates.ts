import { generateUrlCacheKey, updatesCache } from "../core/cache.ts";
import { APPLE_URLS } from "../core/constants.ts";
import { httpClient } from "../core/http-client.ts";
import { logger } from "../core/logger.ts";
import type {
  RenderIndex,
  RenderIndexNode,
  RenderNode,
} from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { formatInlineContent } from "./doc-formatter.ts";

export interface DocumentationUpdatesQuery {
  category: "all" | "wwdc" | "technology" | "release-notes";
  technology?: string | undefined;
  year?: string | undefined;
  searchQuery?: string | undefined;
  includeBeta: boolean;
  limit: number;
}

/**
 * Handle get documentation updates
 */
export const handleGetDocumentationUpdates = async ({
  category,
  technology,
  year,
  searchQuery,
  includeBeta,
  limit,
}: DocumentationUpdatesQuery): Promise<string> => {
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
  });
  const shownUpdates =
    limit > 0 ? filteredUpdates.slice(0, limit) : filteredUpdates;

  // Format output
  const result = formatUpdatesList(shownUpdates, filteredUpdates.length);

  // Cache the result
  updatesCache.set(cacheKey, result);

  return result;
};

/**
 * Parse updates data
 */
const parseUpdates = (updatesData: RenderNode, updatesIndex: RenderIndex) => {
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
            url: reference.url ?? "",
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
};

/**
 * Process index section recursively
 */
const processIndexSection = (
  sections: RenderIndexNode[],
  updates: UpdateItem[],
) => {
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
};

/**
 * Get section category
 */
const getSectionCategory = (title: string): UpdateCategory => {
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
};

/**
 * Extract technology from path
 */
const extractTechnologyFromPath = (path: string): string | undefined => {
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
};

/**
 * Apply filters to updates
 */
const applyUpdatesFilters = (
  updates: UpdateItem[],
  filters: {
    category?: string | undefined;
    technology?: string | undefined;
    year?: string | undefined;
    searchQuery?: string | undefined;
    includeBeta?: boolean | undefined;
  },
): UpdateItem[] => {
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

  return filtered;
};

/**
 * Format updates list
 */
const formatUpdatesList = (updates: UpdateItem[], total: number): string => {
  if (updates.length === 0) {
    return "No documentation updates found matching the specified criteria.";
  }

  let content = `# Apple Developer Documentation Updates\n${total} updates\n`;

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
    content += `\n## ${categoryTitles[category] ?? category}\n`;

    // Add WWDC-specific suggestion
    if (category === "wwdc" && items.length > 0) {
      content +=
        "For session transcripts and code, use list_wwdc_videos, search_wwdc_content and get_wwdc_video.\n";
    }

    items.forEach((item) => {
      const badges = [];
      if (item.beta) {
        badges.push("Beta");
      }
      if (item.images?.some((img) => img.identifier === "new.svg")) {
        badges.push("New");
      }

      const metadata = [...badges];
      if (item.technology && item.category !== "technology") {
        metadata.push(item.technology);
      }
      if (item.year && item.category === "wwdc") {
        metadata.push(item.year);
      }

      content += `- [${item.title}](${item.url})`;
      if (metadata.length > 0) {
        content += ` (${metadata.join(", ")})`;
      }
      if (item.description) {
        content += `: ${item.description}`;
      }
      content += "\n";
    });
  });

  if (total > updates.length) {
    content += `\nShowing ${updates.length} of ${total}. Narrow with category, technology or searchQuery, or raise limit.\n`;
  }

  return content.trimEnd();
};

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
