import type { RenderNode } from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { PROCESSING_LIMITS } from "../utils/constants.ts";
import { httpClient } from "../utils/http-client.ts";
import { logger } from "../utils/logger.ts";
import { convertToJsonApiUrl } from "../utils/url-converter.ts";
import { formatInlineContent } from "./doc-formatter.ts";

/**
 * 关联API信息接口
 */
interface RelatedAPI {
  title: string;
  url: string;
  identifier: string;
  type: string;
  relationship: string;
  abstract?: string | undefined;
}

type References = RenderNode["references"];

/**
 * 获取相关API
 */
export async function handleGetRelatedApis(
  apiUrl: string,
  includeInherited: boolean = true,
  includeConformance: boolean = true,
  includeSeeAlso: boolean = true,
): Promise<string> {
  try {
    logger.info(`Fetching related APIs for: ${apiUrl}`);

    // 将网页URL转换为JSON API URL
    const jsonApiUrl = convertToJsonApiUrl(apiUrl);

    if (!jsonApiUrl) {
      throw new Error("Invalid Apple Developer Documentation URL");
    }

    const data = await httpClient.getJson<RenderNode>(jsonApiUrl);

    // 收集所有相关API
    const relatedApis: RelatedAPI[] = [];

    // 处理关系部分（继承、一致性等）
    if (data.relationshipsSections) {
      for (const section of data.relationshipsSections) {
        const shouldInclude =
          (includeInherited &&
            (section.type === "inheritsFrom" ||
              section.type === "inheritedBy")) ||
          (includeConformance &&
            (section.type === "conformsTo" ||
              section.type === "conformingTypes"));

        if (shouldInclude && section.identifiers) {
          for (const identifier of section.identifiers) {
            const api = extractApiFromIdentifier(
              identifier,
              section.title,
              data.references,
            );
            if (api) {
              relatedApis.push(api);
            }
          }
        }
      }
    }

    // 处理"另请参阅"部分
    if (includeSeeAlso && data.seeAlsoSections) {
      for (const section of data.seeAlsoSections) {
        if (section.identifiers) {
          for (const identifier of section.identifiers) {
            const api = extractApiFromIdentifier(
              identifier,
              `See Also: ${section.title ?? ""}`,
              data.references,
            );
            if (api) {
              relatedApis.push(api);
            }
          }
        }
      }
    }

    // 处理主题部分的相关API
    if (data.topicSections) {
      for (const section of data.topicSections) {
        if (section.identifiers && section.identifiers.length > 0) {
          // 只取前3个，避免过多
          const limitedIdentifiers = section.identifiers.slice(
            0,
            PROCESSING_LIMITS.MAX_RELATED_APIS_PER_SECTION,
          );
          for (const identifier of limitedIdentifiers) {
            const api = extractApiFromIdentifier(
              identifier,
              `Related: ${section.title ?? ""}`,
              data.references,
            );
            if (api) {
              relatedApis.push(api);
            }
          }
        }
      }
    }

    // 去重
    const uniqueApis = deduplicateApis(relatedApis);

    // 格式化输出
    return formatRelatedApis(apiUrl, uniqueApis);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: Failed to get related APIs: ${errorMessage}`;
  }
}

/**
 * 从标识符提取API信息
 */
function extractApiFromIdentifier(
  identifier: string,
  relationship: string,
  references: References,
): RelatedAPI | null {
  // 先从references中查找
  const ref = references?.[identifier];
  if (isTopicReference(ref)) {
    return {
      title: ref.title,
      url: `https://developer.apple.com${ref.url}`,
      identifier,
      type: ref.kind,
      relationship,
      abstract: ref.abstract
        ? formatInlineContent(ref.abstract, references).trim()
        : undefined,
    };
  }

  // 如果references中没有，尝试解析标识符
  if (identifier.startsWith("doc://")) {
    const parts = identifier.split("/");
    const apiName = parts[parts.length - 1] || "Unknown";
    const pathPart = identifier.replace(/^doc:\/\/[^/]+\/documentation\//, "");

    return {
      title: apiName,
      url: `https://developer.apple.com/documentation/${pathPart}`,
      identifier,
      type: "symbol",
      relationship,
    };
  }

  return null;
}

/**
 * 去重API列表
 */
function deduplicateApis(apis: RelatedAPI[]): RelatedAPI[] {
  const seen = new Set<string>();
  return apis.filter((api) => {
    if (seen.has(api.identifier)) {
      return false;
    }
    seen.add(api.identifier);
    return true;
  });
}

/**
 * 格式化相关API输出
 */
function formatRelatedApis(
  originalUrl: string,
  relatedApis: RelatedAPI[],
): string {
  if (relatedApis.length === 0) {
    return `No related APIs found for: ${originalUrl}`;
  }

  const apiName = new URL(originalUrl).pathname.split("/").pop() || "API";
  let content = `# Related APIs for ${apiName}\n\n`;
  content += `**Source:** [${originalUrl}](${originalUrl})\n\n`;
  content += `**Found ${relatedApis.length} related APIs:**\n\n`;

  // 按关系类型分组
  const groupedApis = groupApisByRelationship(relatedApis);

  for (const [relationship, apis] of groupedApis) {
    content += `## ${relationship}\n\n`;

    for (const api of apis) {
      content += `### [${api.title}](${api.url})\n`;

      if (api.abstract) {
        content += `${api.abstract}\n\n`;
      }

      content += `*Type: ${api.type}*\n\n`;
    }
  }

  content += `---\n\n*Total: ${relatedApis.length} related APIs*`;

  return content;
}

/**
 * 按关系类型分组API
 */
function groupApisByRelationship(
  apis: RelatedAPI[],
): Map<string, RelatedAPI[]> {
  const groups = new Map<string, RelatedAPI[]>();

  for (const api of apis) {
    const group = groups.get(api.relationship) ?? [];
    group.push(api);
    groups.set(api.relationship, group);
  }

  return groups;
}
