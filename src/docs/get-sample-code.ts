import { generateUrlCacheKey, sampleCodeCache } from "../core/cache.ts";
import { APPLE_URLS } from "../core/constants.ts";
import { httpClient } from "../core/http-client.ts";
import type {
  RenderIndex,
  RenderIndexNode,
  RenderNode,
} from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { formatInlineContent } from "./doc-formatter.ts";
import { normalizeFrameworkName } from "./framework-mapper.ts";
import { technologyNames } from "./list-technologies.ts";

// Types for sample code responses
interface ParsedSampleCode {
  id: string;
  title: string;
  framework?: string | undefined;
  description?: string | undefined;
  beta: boolean;
  featured?: boolean | undefined;
  url: string;
  path: string;
  depth: number;
}

interface SampleCodeFilters {
  framework?: string | undefined;
  beta?: "include" | "exclude" | "only" | undefined;
  searchQuery?: string | undefined;
}

export interface SampleCodeQuery {
  framework?: string | undefined;
  beta: "include" | "exclude" | "only";
  searchQuery?: string | undefined;
  limit: number;
}

/**
 * Handles the get_sample_code tool request
 */
export const handleGetSampleCode = async ({
  framework,
  beta,
  searchQuery,
  limit,
}: SampleCodeQuery): Promise<string> => {
  // Generate cache key
  const cacheKey = generateUrlCacheKey("sample-code", {
    framework,
    beta,
    searchQuery,
    limit,
  });

  // Try to get from cache first
  const cachedResult = sampleCodeCache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // Fetch both JSON files
  const [contentResponse, indexResponse, names] = await Promise.all([
    httpClient.get(APPLE_URLS.SAMPLE_CODE_JSON),
    httpClient.get(APPLE_URLS.SAMPLE_CODE_INDEX_JSON),
    technologyNames(),
  ]);

  if (!contentResponse.ok) {
    throw new Error(
      `Failed to fetch sample code content: ${contentResponse.statusText}`,
    );
  }
  if (!indexResponse.ok) {
    throw new Error(
      `Failed to fetch sample code index: ${indexResponse.statusText}`,
    );
  }

  const contentData = (await contentResponse.json()) as RenderNode;
  const indexData = (await indexResponse.json()) as RenderIndex;

  // Parse the sample codes
  const sampleCodes = parseSampleCodes(contentData, indexData, names);

  // Apply filters
  const filters: SampleCodeFilters = {
    framework,
    beta,
    searchQuery,
  };
  const filteredSampleCodes = applySampleCodeFilters(sampleCodes, filters);

  // Sort by relevance (featured first, then alphabetically)
  const sortedSampleCodes = filteredSampleCodes.sort((a, b) => {
    if (a.featured && !b.featured) {
      return -1;
    }
    if (!a.featured && b.featured) {
      return 1;
    }
    return a.title.localeCompare(b.title);
  });

  // Apply limit
  const limitedSampleCodes = sortedSampleCodes.slice(0, limit);

  // Format the result
  const result = formatSampleCodeResult(limitedSampleCodes, {
    totalFound: filteredSampleCodes.length,
    showing: limitedSampleCodes.length,
  });

  // Cache the result
  sampleCodeCache.set(cacheKey, result);
  return result;
};

/**
 * Parses sample codes from the content and index data
 */
const parseSampleCodes = (
  content: RenderNode,
  index: RenderIndex,
  names: Map<string, string>,
): ParsedSampleCode[] => {
  const sampleCodes: ParsedSampleCode[] = [];
  const featuredIds = new Set<string>();

  // Extract featured sample codes from primary content sections
  if (content.primaryContentSections) {
    for (const section of content.primaryContentSections) {
      if ("kind" in section && section.kind === "content") {
        for (const contentItem of section.content) {
          if ("type" in contentItem && contentItem.type === "links") {
            for (const item of contentItem.items) {
              featuredIds.add(item);
            }
          }
        }
      }
    }
  }

  // Extract framework mapping from topic sections
  const frameworkMap = new Map<string, string>();
  if (content.topicSections) {
    for (const section of content.topicSections) {
      for (const identifier of section.identifiers) {
        frameworkMap.set(identifier, section.title ?? "");
      }
    }
  }

  // Process index data
  for (const [, nodes] of Object.entries(index.interfaceLanguages)) {
    processSampleCodeNodes(
      nodes,
      sampleCodes,
      frameworkMap,
      featuredIds,
      "",
      0,
    );
  }

  // Each sample's one-line summary, from the library page's references, keyed by its path
  const summaries = new Map(
    Object.values(content.references ?? {})
      .filter(isTopicReference)
      .map((ref) => [
        ref.url,
        formatInlineContent(ref.abstract ?? [], content.references).trim(),
      ]),
  );

  // Deduplicate sample codes based on path; each framework as Apple's technologies index names it, not its URL path
  return deduplicateSampleCodes(sampleCodes).map((code) => ({
    ...code,
    framework: names.get(code.path.split("/")[2] ?? "") ?? code.framework,
    description: summaries.get(code.path),
  }));
};

/**
 * Deduplicates sample codes based on path
 */
const deduplicateSampleCodes = (
  sampleCodes: ParsedSampleCode[],
): ParsedSampleCode[] => {
  const uniqueCodes = new Map<string, ParsedSampleCode>();

  for (const code of sampleCodes) {
    const existing = uniqueCodes.get(code.path);
    if (!existing) {
      uniqueCodes.set(code.path, code);
    } else {
      // Merge properties, preferring non-empty values
      uniqueCodes.set(code.path, {
        ...existing,
        framework: code.framework || existing.framework,
        featured: code.featured || existing.featured,
        beta: code.beta || existing.beta,
        depth: Math.min(code.depth, existing.depth),
      });
    }
  }

  return Array.from(uniqueCodes.values());
};

/**
 * Recursively processes sample code nodes
 */
const processSampleCodeNodes = (
  nodes: RenderIndexNode[],
  sampleCodes: ParsedSampleCode[],
  frameworkMap: Map<string, string>,
  featuredIds: Set<string>,
  currentFramework: string,
  depth: number,
): void => {
  for (const node of nodes) {
    if (node.type === "groupMarker") {
      // This is a framework/category marker
      const framework = normalizeFrameworkName(node.title);
      if (node.children) {
        processSampleCodeNodes(
          node.children,
          sampleCodes,
          frameworkMap,
          featuredIds,
          framework,
          depth + 1,
        );
      }
    } else if (node.type === "sampleCode" && node.path) {
      // Try to extract framework from path first
      const frameworkFromPath = extractFrameworkFromPath(node.path);

      // Convert path to doc URL format for matching with framework map
      const docUrl = pathToDocUrl(node.path);
      const frameworkFromMap = frameworkMap.get(docUrl);

      // Priority: path > map > groupMarker
      const framework = normalizeFrameworkName(
        frameworkFromPath || frameworkFromMap || currentFramework,
      );

      sampleCodes.push({
        id: node.path,
        title: node.title,
        framework: framework || undefined,
        beta: node.beta || false,
        featured: featuredIds.has(docUrl),
        url: node.path,
        path: node.path,
        depth,
      });
    } else if (node.children) {
      // Process children with the same framework
      processSampleCodeNodes(
        node.children,
        sampleCodes,
        frameworkMap,
        featuredIds,
        currentFramework,
        depth + 1,
      );
    }
  }
};

/**
 * Extract framework name from URL path
 */
const extractFrameworkFromPath = (path: string): string | null => {
  // Match pattern like /documentation/framework/...
  const match = path.match(/^\/documentation\/([^/]+)\//);
  if (match) {
    const framework = match[1];
    // Don't return generic paths like 'samplecode'
    if (framework === "samplecode" || framework === "documentation") {
      return null;
    }
    return normalizeFrameworkName(framework);
  }
  return null;
};

/**
 * Converts a path to doc URL format
 */
const pathToDocUrl = (path: string): string => {
  // Convert /documentation/framework/sample-name to doc://com.apple.documentation/documentation/framework/sample-name
  return `doc://com.apple.documentation${path}`;
};

/**
 * Applies filters to sample codes
 */
const applySampleCodeFilters = (
  sampleCodes: ParsedSampleCode[],
  filters: SampleCodeFilters,
): ParsedSampleCode[] => {
  return sampleCodes.filter((code) => {
    // Framework filter - normalize both for comparison
    if (filters.framework) {
      const normalizedFilterFramework = normalizeFrameworkName(
        filters.framework,
      );
      const normalizedCodeFramework = normalizeFrameworkName(
        code.framework || "",
      );

      // Check for exact match or inclusion
      const frameworkLower = normalizedFilterFramework.toLowerCase();
      const codeFrameworkLower = normalizedCodeFramework.toLowerCase();

      // Also check if the filter term appears in the title or path
      const titleLower = code.title.toLowerCase();
      const pathLower = code.path.toLowerCase();

      const frameworkMatch =
        frameworkLower === codeFrameworkLower ||
        codeFrameworkLower.includes(frameworkLower) ||
        titleLower.includes(frameworkLower) ||
        pathLower.includes(frameworkLower);

      if (!frameworkMatch) {
        return false;
      }
    }

    // Beta filter
    if (filters.beta === "exclude" && code.beta) {
      return false;
    } else if (filters.beta === "only" && !code.beta) {
      return false;
    }

    // Search query filter - enhanced matching
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();

      // Score-based matching for better relevance
      let matchScore = 0;

      // Title match (highest weight)
      const titleLower = code.title.toLowerCase();
      if (titleLower === query) {
        matchScore += 10; // Exact match
      } else if (titleLower.startsWith(query)) {
        matchScore += 5; // Starts with query
      } else if (titleLower.includes(query)) {
        matchScore += 3; // Contains query
      }

      // Framework match
      const frameworkLower = (code.framework || "").toLowerCase();
      if (frameworkLower.includes(query)) {
        matchScore += 2;
      }

      // Path match (check if query is in the path)
      const pathLower = code.path.toLowerCase();
      if (pathLower.includes(query)) {
        matchScore += 1;
      }

      // Description match (if available)
      const descriptionLower = (code.description || "").toLowerCase();
      if (descriptionLower.includes(query)) {
        matchScore += 1;
      }

      // Only include if there's at least one match
      if (matchScore === 0) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Formats the sample code result
 */
const formatSampleCodeResult = (
  sampleCodes: ParsedSampleCode[],
  options: {
    totalFound: number;
    showing: number;
  },
): string => {
  const lines: string[] = [];

  lines.push("# Apple Sample Code Library");
  lines.push(`${options.totalFound} sample code projects`);
  lines.push("");

  if (sampleCodes.length === 0) {
    lines.push("No sample code projects found matching your criteria.");
    return lines.join("\n");
  }

  // Group by framework/category with normalization
  const byCategory = new Map<string, ParsedSampleCode[]>();
  const noCategory: ParsedSampleCode[] = [];

  for (const code of sampleCodes) {
    const category = code.framework || "";
    if (category) {
      // Group WWDC samples together
      const normalizedCategory = category.match(/^WWDC\d+$/i)
        ? category.toUpperCase()
        : category;
      const group = byCategory.get(normalizedCategory) ?? [];
      group.push(code);
      byCategory.set(normalizedCategory, group);
    } else {
      noCategory.push(code);
    }
  }

  // Sort categories with WWDC years first (newest to oldest), then alphabetically
  const sortedCategories = Array.from(byCategory.keys()).sort((a, b) => {
    const aIsWWDC = a.match(/^WWDC(\d+)$/);
    const bIsWWDC = b.match(/^WWDC(\d+)$/);

    if (aIsWWDC && bIsWWDC) {
      // Sort WWDC by year descending
      return parseInt(bIsWWDC[1] ?? "", 10) - parseInt(aIsWWDC[1] ?? "", 10);
    } else if (aIsWWDC) {
      return -1; // WWDC comes first
    } else if (bIsWWDC) {
      return 1;
    }

    return a.localeCompare(b); // Alphabetical for non-WWDC
  });

  // Display featured samples first if any
  const featuredSamples = sampleCodes.filter((c) => c.featured);
  if (featuredSamples.length > 0) {
    lines.push("## Featured");
    for (const code of featuredSamples) {
      lines.push(formatSampleCodeItem(code, false)); // Don't show framework in featured section
    }
    lines.push("");
  }

  // Display by category
  for (const category of sortedCategories) {
    const codes = byCategory.get(category) ?? [];
    const nonFeaturedCodes = codes.filter((c) => !c.featured);

    if (nonFeaturedCodes.length > 0) {
      lines.push(`## ${category}`);
      for (const code of nonFeaturedCodes) {
        lines.push(formatSampleCodeItem(code, false)); // Framework already shown in section header
      }
      lines.push("");
    }
  }

  // Display samples without category
  if (noCategory.length > 0) {
    const nonFeaturedOther = noCategory.filter((c) => !c.featured);
    if (nonFeaturedOther.length > 0) {
      lines.push("## Other");
      for (const code of nonFeaturedOther) {
        lines.push(formatSampleCodeItem(code, false));
      }
      lines.push("");
    }
  }

  if (options.showing < options.totalFound) {
    lines.push(
      `Showing ${options.showing} of ${options.totalFound}. Narrow with searchQuery or framework, or raise limit.`,
    );
  }

  return lines.join("\n").trim();
};

/**
 * Formats a single sample code item
 */
const formatSampleCodeItem = (
  code: ParsedSampleCode,
  showFramework: boolean = true,
): string => {
  const badges: string[] = [];
  if (code.beta) {
    badges.push("(Beta)");
  }

  // Don't duplicate the featured badge as it's already in the section header
  const badgeStr = badges.length > 0 ? ` ${badges.join(" ")}` : "";

  // Framework info (only if requested and not in a framework-specific section)
  const frameworkStr =
    showFramework && code.framework ? ` (${code.framework})` : "";

  return `- [${code.title}](${code.url})${badgeStr}${frameworkStr}${code.description ? `: ${code.description}` : ""}`;
};
