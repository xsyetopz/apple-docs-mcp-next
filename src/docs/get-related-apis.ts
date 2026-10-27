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
  relationship: string;
  abstract?: string | undefined;
}

type References = RenderNode["references"];

/** The relationship prefix of a Topics section's members, before the section's title */
const TOPICS = "Topics: ";

export interface RelatedApisQuery {
  apiUrl: string;
  includeInherited: boolean;
  includeConformance: boolean;
  includeSeeAlso: boolean;
  limit: number;
}

export const handleGetRelatedApis = async ({
  apiUrl,
  includeInherited,
  includeConformance,
  includeSeeAlso,
  limit,
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
            "See Also",
            data.references,
          );
          if (api) {
            relatedApis.push(api);
          }
        }
      }
    }
  }

  // How many members of each Topics section the 3-per-section cut leaves out
  const topicsLeftOut = new Map<string, number>();
  if (data.topicSections) {
    for (const section of data.topicSections) {
      if (section.identifiers && section.identifiers.length > 0) {
        // Only the first 3 per section: the page itself lists the rest
        const limitedIdentifiers = section.identifiers.slice(
          0,
          PROCESSING_LIMITS.MAX_RELATED_APIS_PER_SECTION,
        );
        const relationship = `${TOPICS}${section.title ?? ""}`;
        for (const identifier of limitedIdentifiers) {
          const api = extractApiFromIdentifier(
            identifier,
            relationship,
            data.references,
          );
          if (api) {
            relatedApis.push(api);
          }
        }
        topicsLeftOut.set(
          relationship,
          section.identifiers.length - limitedIdentifiers.length,
        );
      }
    }
  }

  const uniqueApis = deduplicateApis(relatedApis);

  return formatRelatedApis(apiUrl, uniqueApis, limit, topicsLeftOut);
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
  limit: number,
  topicsLeftOut: Map<string, number>,
): string => {
  if (relatedApis.length === 0) {
    return `No related APIs found for: ${originalUrl}`;
  }

  const apiName = new URL(originalUrl).pathname.split("/").pop() || "API";
  let content = `# Related APIs for ${apiName}\n${relatedApis.length} related APIs\n`;
  let capped = false;
  let topicsHeading = false;

  for (const [relationship, apis] of groupApisByRelationship(relatedApis)) {
    // A Topics section is one line of linked names: get_apple_doc_content gives their summaries
    if (relationship.startsWith(TOPICS)) {
      if (!topicsHeading) {
        content += "\n## Topics\n";
        topicsHeading = true;
      }
      const links = apis.map((api) => `[${api.title}](${api.url})`).join(", ");
      const leftOut = topicsLeftOut.get(relationship) ?? 0;
      const more = leftOut > 0 ? `, +${leftOut} more` : "";
      content += `- ${relationship.slice(TOPICS.length) || "Other"}: ${links}${more}\n`;
      continue;
    }

    content += `\n## ${relationship}\n`;

    for (const api of apis.slice(0, limit)) {
      content += `- [${api.title}](${api.url})${api.abstract ? `: ${api.abstract}` : ""}\n`;
    }
    if (apis.length > limit) {
      capped = true;
      content += `…and ${apis.length - limit} more\n`;
    }
  }

  if (capped) {
    content += `\nShowing ${limit} per group. Raise limit to see more.\n`;
  }

  return content.trimEnd();
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
