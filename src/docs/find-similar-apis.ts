import { PROCESSING_LIMITS, SEARCH_DEPTH_LIMITS } from "../core/constants.ts";
import { httpClient } from "../core/http-client.ts";
import { logger } from "../core/logger.ts";
import type {
  RenderBlockContent,
  RenderInlineContent,
  RenderNode,
  TasksGroupSection,
} from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import {
  formatInlineContent,
  formatIntroducedVersion,
} from "./doc-formatter.ts";
import { convertToJsonApiUrl } from "./url-converter.ts";

interface SimilarAPI {
  title: string;
  url: string;
  identifier: string;
  abstract?: string | undefined;
  category: string;
  similarityType: string;
  symbolKind?: string;
  confidence: number; // Similarity score, out of 10
}

type References = RenderNode["references"];

export interface SimilarApisQuery {
  apiUrl: string;
  searchDepth: "shallow" | "medium" | "deep";
  filterByCategory?: string | undefined;
  includeAlternatives: boolean;
  limit: number;
}

export const handleFindSimilarApis = async ({
  apiUrl,
  searchDepth,
  filterByCategory,
  includeAlternatives,
  limit,
}: SimilarApisQuery): Promise<string> => {
  try {
    logger.info(`Finding similar APIs for: ${apiUrl}`);

    const jsonApiUrl = convertToJsonApiUrl(apiUrl);

    if (!jsonApiUrl) {
      throw new Error("Invalid Apple Developer Documentation URL");
    }

    // Apple's JSON is the page itself; a page wrapped in `data` keeps its references beside it
    const response = await httpClient.getJson<
      RenderNode & { data?: RenderNode }
    >(jsonApiUrl);
    const data = response.data ?? response;
    const references = response.references ?? data.references;

    // Collect similar APIs; a deprecated API's own note names its replacements
    const deprecation = data.deprecationSummary ?? [];
    const similarApis: SimilarAPI[] = replacementsIn(deprecation, references);

    if (data.seeAlsoSections) {
      const seeAlsoApis = extractSeeAlsoApis(
        data.seeAlsoSections,
        references,
        filterByCategory,
      );
      similarApis.push(...seeAlsoApis);
    }

    if (searchDepth === "medium" || searchDepth === "deep") {
      if (data.topicSections && includeAlternatives) {
        const topicApis = extractTopicApis(
          data.topicSections,
          references,
          filterByCategory,
        );
        similarApis.push(...topicApis);
      }
    }

    if (searchDepth === "deep") {
      const deepApis = await extractDeepRelatedApis(
        similarApis.slice(
          0,
          PROCESSING_LIMITS.MAX_SIMILAR_APIS_FOR_DEEP_SEARCH,
        ),
      ); // Expand only the first 3 similar APIs
      similarApis.push(...deepApis);
    }

    const uniqueApis = deduplicateAndScore(similarApis);

    uniqueApis.sort((a, b) => b.confidence - a.confidence);

    const limitedApis = uniqueApis.slice(
      0,
      Math.min(limit, SEARCH_DEPTH_LIMITS[searchDepth]),
    );

    const title = data.metadata?.title ?? "API";

    const deprecationNote = paragraphsOf(deprecation)
      .map((inline) => formatInlineContent(inline, references))
      .join(" ")
      .trim();
    return formatSimilarApis(
      apiUrl,
      limitedApis,
      uniqueApis.length,
      title,
      data,
      deprecationNote,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("Invalid Apple Developer Documentation URL")) {
      throw error;
    }
    throw new Error(errorMessage, { cause: error });
  }
};

/**
 * The pages a deprecation note links, first among the similar APIs
 */
const replacementsIn = (
  deprecation: RenderBlockContent[],
  references: References,
): SimilarAPI[] => {
  return paragraphsOf(deprecation)
    .flat()
    .flatMap((inline) =>
      inline.type === "reference"
        ? [
            createSimilarApi(
              inline.identifier,
              "Named in the deprecation note",
              "Replacement",
              10,
              references,
            ),
          ]
        : [],
    )
    .filter((api): api is SimilarAPI => api !== null);
};

/** The inline content of each paragraph among blocks */
const paragraphsOf = (
  blocks: RenderBlockContent[],
): RenderInlineContent[][] => {
  return blocks.flatMap((block) =>
    "type" in block && block.type === "paragraph" ? [block.inlineContent] : [],
  );
};

const extractSeeAlsoApis = (
  seeAlsoSections: TasksGroupSection[],
  references: References,
  filterByCategory?: string,
): SimilarAPI[] => {
  const apis: SimilarAPI[] = [];

  for (const section of seeAlsoSections) {
    if (
      filterByCategory &&
      !(section.title ?? "")
        .toLowerCase()
        .includes(filterByCategory.toLowerCase())
    ) {
      continue;
    }

    for (const identifier of section.identifiers) {
      const api = createSimilarApi(
        identifier,
        section.title ?? "",
        "See Also",
        8, // High similarity
        references,
      );
      if (api) {
        apis.push(api);
      }
    }
  }

  return apis;
};

const extractTopicApis = (
  topicSections: TasksGroupSection[],
  references: References,
  filterByCategory?: string,
): SimilarAPI[] => {
  const apis: SimilarAPI[] = [];

  for (const section of topicSections) {
    if (
      filterByCategory &&
      !(section.title ?? "")
        .toLowerCase()
        .includes(filterByCategory.toLowerCase())
    ) {
      continue;
    }

    const limitedIdentifiers = section.identifiers.slice(
      0,
      PROCESSING_LIMITS.MAX_TOPIC_IDENTIFIERS,
    );

    for (const identifier of limitedIdentifiers) {
      const api = createSimilarApi(
        identifier,
        section.title ?? "",
        "Topic Group",
        6, // Medium similarity
        references,
      );
      if (api) {
        apis.push(api);
      }
    }
  }

  return apis;
};

const extractDeepRelatedApis = async (
  seedApis: SimilarAPI[],
): Promise<SimilarAPI[]> => {
  const deepApis: SimilarAPI[] = [];

  for (const seedApi of seedApis) {
    try {
      const jsonApiUrl = convertToJsonApiUrl(seedApi.url);

      if (!jsonApiUrl) {
        logger.warn(`Failed to convert URL: ${seedApi.url}`);
        continue;
      }

      const response = await httpClient.getJson<
        RenderNode & { data?: RenderNode }
      >(jsonApiUrl);
      const data = response.data ?? response;
      const references = response.references ?? data.references;

      // Only take See Also here, to avoid over-expanding
      if (data.seeAlsoSections) {
        const relatedApis = extractSeeAlsoApis(
          data.seeAlsoSections,
          references,
        );
        relatedApis.forEach((api) => {
          api.confidence = Math.max(api.confidence - 2, 3);
          api.similarityType = "Deep Related";
        });
        deepApis.push(...relatedApis);
      }
    } catch (error) {
      logger.error(`Failed to fetch deep related API ${seedApi.url}:`, error);
    }
  }

  return deepApis;
};

const createSimilarApi = (
  identifier: string,
  category: string,
  similarityType: string,
  confidence: number,
  references: References,
): SimilarAPI | null => {
  const ref = references?.[identifier];
  if (isTopicReference(ref)) {
    return {
      title: ref.title,
      url: ref.url,
      identifier,
      abstract: ref.abstract
        ? formatInlineContent(ref.abstract, references).trim()
        : undefined,
      category,
      similarityType,
      symbolKind: ref.kind,
      confidence,
    };
  }

  if (identifier.startsWith("doc://")) {
    const parts = identifier.split("/");
    const apiName = parts[parts.length - 1] || "Unknown";
    const pathPart = identifier.replace(/^doc:\/\/[^/]+\/documentation\//, "");

    return {
      title: apiName,
      url: `/documentation/${pathPart}`,
      identifier,
      category,
      similarityType,
      confidence: confidence - 1,
    };
  }

  return null;
};

const deduplicateAndScore = (apis: SimilarAPI[]): SimilarAPI[] => {
  const apiMap = new Map<string, SimilarAPI>();

  for (const api of apis) {
    const existing = apiMap.get(api.identifier);
    if (existing) {
      if (api.confidence > existing.confidence) {
        apiMap.set(api.identifier, api);
      }
    } else {
      apiMap.set(api.identifier, api);
    }
  }

  return Array.from(apiMap.values());
};

const formatSimilarApis = (
  originalUrl: string,
  similarApis: SimilarAPI[],
  foundCount: number,
  originalApiName?: string,
  originalData?: RenderNode,
  deprecationNote?: string,
): string => {
  const apiName =
    originalApiName || new URL(originalUrl).pathname.split("/").pop() || "API";
  let content = `# Similar APIs to ${apiName}\n\n`;
  if (deprecationNote) {
    content += `**Deprecated:** ${deprecationNote}\n\n`;
  }

  if (similarApis.length === 0) {
    content += "No similar APIs found";
    return content;
  }

  if (originalData?.metadata) {
    const roleHeading = originalData.metadata.roleHeading || "";
    const platforms =
      originalData.metadata.platforms
        ?.map((p) => `${p.name}${formatIntroducedVersion(p)}`)
        .join(", ") || "";
    if (roleHeading || platforms) {
      content += `${roleHeading}${platforms ? ` · ${platforms}` : ""}\n\n`;
    }
  }

  content += `${similarApis.length} similar APIs\n`;

  // Group by category instead of similarity type for better organization
  const groupedByCategory = new Map<string, SimilarAPI[]>();

  for (const api of similarApis) {
    const key = `${api.similarityType}: ${api.category}`;
    const group = groupedByCategory.get(key) ?? [];
    group.push(api);
    groupedByCategory.set(key, group);
  }

  for (const [categoryKey, apis] of groupedByCategory) {
    content += `\n## ${categoryKey}\n`;

    for (const api of apis) {
      content += `- [${api.title}](${api.url})${api.abstract ? `: ${api.abstract}` : ""}\n`;
    }
  }

  if (foundCount > similarApis.length) {
    content += `\n…and ${foundCount - similarApis.length} more\n\nShowing ${similarApis.length} of ${foundCount}. Raise limit or depth (shallow ${SEARCH_DEPTH_LIMITS.shallow}, medium ${SEARCH_DEPTH_LIMITS.medium}, deep ${SEARCH_DEPTH_LIMITS.deep}) to see more.\n`;
  }

  return content.trimEnd();
};
