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

/**
 * 相似API信息接口
 */
interface SimilarAPI {
  title: string;
  url: string;
  identifier: string;
  abstract?: string | undefined;
  category: string;
  similarityType: string;
  symbolKind?: string;
  confidence: number; // 1-10 相似度评分
}

type References = RenderNode["references"];

/**
 * 查找相似API
 */
export async function handleFindSimilarApis(
  apiUrl: string,
  searchDepth: string = "medium",
  filterByCategory?: string,
  includeAlternatives: boolean = true,
): Promise<string> {
  try {
    logger.info(`Finding similar APIs for: ${apiUrl}`);

    const jsonApiUrl = convertToJsonApiUrl(apiUrl);

    // Check if conversion failed
    if (!jsonApiUrl) {
      throw new Error("Invalid Apple Developer Documentation URL");
    }

    // Apple's JSON is the page itself; a page wrapped in `data` keeps its references beside it
    const response = await httpClient.getJson<
      RenderNode & { data?: RenderNode }
    >(jsonApiUrl);
    const data = response.data ?? response;
    const references = response.references ?? data.references;

    // 收集相似API; a deprecated API's own note names its replacements
    const deprecation = data.deprecationSummary ?? [];
    const similarApis: SimilarAPI[] = replacementsIn(deprecation, references);

    // 1. 从"另请参阅"部分收集
    if (data.seeAlsoSections) {
      const seeAlsoApis = extractSeeAlsoApis(
        data.seeAlsoSections,
        references,
        filterByCategory,
      );
      similarApis.push(...seeAlsoApis);
    }

    // 2. 从主题部分收集（medium 和 deep 模式）
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

    // 3. 深度搜索相关API（deep 模式）
    if (searchDepth === "deep") {
      const deepApis = await extractDeepRelatedApis(
        similarApis.slice(
          0,
          PROCESSING_LIMITS.MAX_SIMILAR_APIS_FOR_DEEP_SEARCH,
        ),
      ); // 限制前3个
      similarApis.push(...deepApis);
    }

    // 去重和评分
    const uniqueApis = deduplicateAndScore(similarApis);

    // 按相似度排序
    uniqueApis.sort((a, b) => b.confidence - a.confidence);

    // 限制结果数量
    const maxResults =
      SEARCH_DEPTH_LIMITS[searchDepth as keyof typeof SEARCH_DEPTH_LIMITS] ||
      SEARCH_DEPTH_LIMITS.medium;
    const limitedApis = uniqueApis.slice(0, maxResults);

    // Get the title from data
    const title = data.metadata?.title ?? "API";

    const deprecationNote = paragraphsOf(deprecation)
      .map((inline) => formatInlineContent(inline, references))
      .join(" ")
      .trim();
    return formatSimilarApis(apiUrl, limitedApis, title, data, deprecationNote);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("Invalid Apple Developer Documentation URL")) {
      throw error;
    }
    throw new Error(errorMessage, { cause: error });
  }
}

/**
 * The pages a deprecation note links, first among the similar APIs
 */
function replacementsIn(
  deprecation: RenderBlockContent[],
  references: References,
): SimilarAPI[] {
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
}

/** The inline content of each paragraph among blocks */
function paragraphsOf(blocks: RenderBlockContent[]): RenderInlineContent[][] {
  return blocks.flatMap((block) =>
    "type" in block && block.type === "paragraph" ? [block.inlineContent] : [],
  );
}

/**
 * 从"另请参阅"部分提取API
 */
function extractSeeAlsoApis(
  seeAlsoSections: TasksGroupSection[],
  references: References,
  filterByCategory?: string,
): SimilarAPI[] {
  const apis: SimilarAPI[] = [];

  for (const section of seeAlsoSections) {
    // 过滤分类
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
        8, // 高相似度
        references,
      );
      if (api) {
        apis.push(api);
      }
    }
  }

  return apis;
}

/**
 * 从主题部分提取API
 */
function extractTopicApis(
  topicSections: TasksGroupSection[],
  references: References,
  filterByCategory?: string,
): SimilarAPI[] {
  const apis: SimilarAPI[] = [];

  for (const section of topicSections) {
    // 过滤分类
    if (
      filterByCategory &&
      !(section.title ?? "")
        .toLowerCase()
        .includes(filterByCategory.toLowerCase())
    ) {
      continue;
    }

    // 限制每个主题的API数量
    const limitedIdentifiers = section.identifiers.slice(
      0,
      PROCESSING_LIMITS.MAX_TOPIC_IDENTIFIERS,
    );

    for (const identifier of limitedIdentifiers) {
      const api = createSimilarApi(
        identifier,
        section.title ?? "",
        "Topic Group",
        6, // 中等相似度
        references,
      );
      if (api) {
        apis.push(api);
      }
    }
  }

  return apis;
}

/**
 * 深度搜索相关API
 */
async function extractDeepRelatedApis(
  seedApis: SimilarAPI[],
): Promise<SimilarAPI[]> {
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

      // 只从"另请参阅"部分获取，避免过度扩展
      if (data.seeAlsoSections) {
        const relatedApis = extractSeeAlsoApis(
          data.seeAlsoSections,
          references,
        );
        // 降低相似度评分
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
}

/**
 * 创建相似API对象
 */
function createSimilarApi(
  identifier: string,
  category: string,
  similarityType: string,
  confidence: number,
  references: References,
): SimilarAPI | null {
  const ref = references?.[identifier];
  if (isTopicReference(ref)) {
    return {
      title: ref.title,
      url: `https://developer.apple.com${ref.url}`,
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

  // 如果references中没有，尝试从标识符解析
  if (identifier.startsWith("doc://")) {
    const parts = identifier.split("/");
    const apiName = parts[parts.length - 1] || "Unknown";
    const pathPart = identifier.replace(/^doc:\/\/[^/]+\/documentation\//, "");

    return {
      title: apiName,
      url: `https://developer.apple.com/documentation/${pathPart}`,
      identifier,
      category,
      similarityType,
      confidence: confidence - 1, // 略降相似度
    };
  }

  return null;
}

/**
 * 去重和评分
 */
function deduplicateAndScore(apis: SimilarAPI[]): SimilarAPI[] {
  const apiMap = new Map<string, SimilarAPI>();

  for (const api of apis) {
    const existing = apiMap.get(api.identifier);
    if (existing) {
      // 如果已存在，保留评分更高的
      if (api.confidence > existing.confidence) {
        apiMap.set(api.identifier, api);
      }
    } else {
      apiMap.set(api.identifier, api);
    }
  }

  return Array.from(apiMap.values());
}

/**
 * 格式化相似API结果
 */
function formatSimilarApis(
  originalUrl: string,
  similarApis: SimilarAPI[],
  originalApiName?: string,
  originalData?: RenderNode,
  deprecationNote?: string,
): string {
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

  // Add metadata about the original API if available
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

  content += `**Source:** [${originalUrl}](${originalUrl})\n\n`;
  content += `**Found ${similarApis.length} similar APIs (sorted by relevance):**\n\n`;

  // Group by category instead of similarity type for better organization
  const groupedByCategory = new Map<string, SimilarAPI[]>();

  for (const api of similarApis) {
    const key = `${api.similarityType}: ${api.category}`;
    const group = groupedByCategory.get(key) ?? [];
    group.push(api);
    groupedByCategory.set(key, group);
  }

  for (const [categoryKey, apis] of groupedByCategory) {
    content += `## ${categoryKey}\n\n`;

    for (const api of apis) {
      content += formatSingleSimilarApi(api);
    }
  }

  // 相似度分析
  content += "## Similarity Analysis\n\n";
  const avgConfidence =
    similarApis.reduce((sum, api) => sum + api.confidence, 0) /
    similarApis.length;
  content += `**Average Similarity:** ${avgConfidence.toFixed(1)}/10\n`;

  const highConfidenceApis = similarApis.filter((api) => api.confidence >= 7);
  if (highConfidenceApis.length > 0) {
    content += `**Highly Similar APIs:** ${highConfidenceApis.length}\n`;
  }

  const categories = [...new Set(similarApis.map((api) => api.category))];
  content += `**Categories:** ${categories.join(", ")}\n\n`;

  content += `---\n\n*Total: ${similarApis.length} similar APIs found*`;

  return content;
}

/**
 * 格式化单个相似API
 */
function formatSingleSimilarApi(api: SimilarAPI): string {
  let content = `### [${api.title}](${api.url})\n`;

  if (api.abstract) {
    content += `${api.abstract}\n\n`;
  }

  // 添加元数据
  const metadata = [`Similarity: ${api.confidence}/10`];
  if (api.symbolKind) {
    metadata.push(`Type: ${api.symbolKind}`);
  }
  if (api.category !== api.similarityType) {
    metadata.push(`Category: ${api.category}`);
  }

  content += `*${metadata.join(" | ")}*\n\n`;

  return content;
}
