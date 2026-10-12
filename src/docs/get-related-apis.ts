import { PROCESSING_LIMITS } from "../core/constants.ts";
import { httpClient } from "../core/http-client.ts";
import { logger } from "../core/logger.ts";
import type { RenderNode } from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { formatInlineContent } from "./doc-formatter.ts";
import { convertToJsonApiUrl } from "./url-converter.ts";

interface RelatedAPI {
  title: string;
  url: string;
  identifier: string;
  type: string;
  relationship: string;
  abstract?: string | undefined;
}

type References = RenderNode["references"];

export interface RelatedApisQuery {
  apiUrl: string;
  includeInherited: boolean;
  includeConformance: boolean;
  includeSeeAlso: boolean;
}

export const handleGetRelatedApis = async ({
  apiUrl,
  includeInherited,
  includeConformance,
  includeSeeAlso,
}: RelatedApisQuery): Promise<string> => {
  logger.info(`Fetching related APIs for: ${apiUrl}`);

  const jsonApiUrl = convertToJsonApiUrl(apiUrl);

  if (!jsonApiUrl) {
    throw new Error("Invalid Apple Developer Documentation URL");
  }

  const data = await httpClient.getJson<RenderNode>(jsonApiUrl);

  const relatedApis: RelatedAPI[] = [];

  // Relationship sections (inheritance, conformance)
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

  if (data.topicSections) {
    for (const section of data.topicSections) {
      if (section.identifiers && section.identifiers.length > 0) {
        // Only the first 3 per section, to avoid too many
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

  const uniqueApis = deduplicateApis(relatedApis);

  return formatRelatedApis(apiUrl, uniqueApis);
};

const extractApiFromIdentifier = (
  identifier: string,
  relationship: string,
  references: References,
): RelatedAPI | null => {
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
};

const deduplicateApis = (apis: RelatedAPI[]): RelatedAPI[] => {
  const seen = new Set<string>();
  return apis.filter((api) => {
    if (seen.has(api.identifier)) {
      return false;
    }
    seen.add(api.identifier);
    return true;
  });
};

const formatRelatedApis = (
  originalUrl: string,
  relatedApis: RelatedAPI[],
): string => {
  if (relatedApis.length === 0) {
    return `No related APIs found for: ${originalUrl}`;
  }

  const apiName = new URL(originalUrl).pathname.split("/").pop() || "API";
  let content = `# Related APIs for ${apiName}\n\n`;
  content += `**Source:** [${originalUrl}](${originalUrl})\n\n`;
  content += `**Found ${relatedApis.length} related APIs:**\n\n`;

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
};

const groupApisByRelationship = (
  apis: RelatedAPI[],
): Map<string, RelatedAPI[]> => {
  const groups = new Map<string, RelatedAPI[]>();

  for (const api of apis) {
    const group = groups.get(api.relationship) ?? [];
    group.push(api);
    groups.set(api.relationship, group);
  }

  return groups;
};
