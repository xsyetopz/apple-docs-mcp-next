import { httpClient } from "../core/http-client.ts";
import { logger } from "../core/logger.ts";
import type { RenderNode, TopicRenderReference } from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { formatInlineContent } from "./doc-formatter.ts";
import { convertToJsonApiUrl } from "./url-converter.ts";

interface ResolvedReference {
  identifier: string;
  title: string;
  url: string;
  type: string;
  role: string;
  abstract?: string;
  kind?: string;
  fragments?: Array<{
    kind: string;
    text: string;
  }>;
}

type References = RenderNode["references"];

export interface ReferencesQuery {
  sourceUrl: string;
  maxReferences: number;
  filterByType: string;
}

export const handleResolveReferencesBatch = async ({
  sourceUrl,
  maxReferences,
  filterByType,
}: ReferencesQuery): Promise<string> => {
  logger.info(`Resolving references from: ${sourceUrl}`);

  const jsonApiUrl = convertToJsonApiUrl(sourceUrl);

  if (!jsonApiUrl) {
    throw new Error("Invalid Apple Developer Documentation URL");
  }

  const data = await httpClient.getJson<RenderNode>(jsonApiUrl);

  if (!data.references || Object.keys(data.references).length === 0) {
    return `No references found in: ${sourceUrl}`;
  }

  const filteredReferences = filterReferences(data.references, filterByType);
  const matched = Object.entries(filteredReferences);
  const limitedReferences = matched.slice(0, maxReferences);

  const resolvedReferences: ResolvedReference[] = [];

  for (const [identifier, refData] of limitedReferences) {
    const resolved = await resolveReference(
      identifier,
      refData,
      data.references,
    );
    if (resolved) {
      resolvedReferences.push(resolved);
    }
  }

  return formatResolvedReferences(
    sourceUrl,
    resolvedReferences,
    matched.length,
    data.metadata?.title,
  );
};

const filterReferences = (
  references: NonNullable<References>,
  filterByType: string,
): Record<string, TopicRenderReference> => {
  return Object.fromEntries(
    Object.entries(references).flatMap(([identifier, refData]) =>
      isTopicReference(refData) &&
      (filterByType === "all" ||
        [refData.role, refData.kind, refData.type].some(
          (value) => value === filterByType,
        ))
        ? [[identifier, refData]]
        : [],
    ),
  );
};

const resolveReference = async (
  identifier: string,
  refData: TopicRenderReference,
  references: References,
): Promise<ResolvedReference | null> => {
  try {
    const resolved: ResolvedReference = {
      identifier,
      title: refData.title || "Unknown",
      url: refData.url ? `https://developer.apple.com${refData.url}` : "#",
      type: refData.type || "unknown",
      role: refData.role || "unknown",
      kind: refData.kind,
    };

    if (refData.abstract && Array.isArray(refData.abstract)) {
      resolved.abstract = formatInlineContent(
        refData.abstract,
        references,
      ).trim();
    }

    if (refData.fragments && Array.isArray(refData.fragments)) {
      resolved.fragments = refData.fragments.map((fragment) => ({
        kind: fragment.kind || "text",
        text: fragment.text || "",
      }));
    }

    return resolved;
  } catch (error) {
    logger.error(`Failed to resolve reference ${identifier}:`, error);
    return null;
  }
};

const formatResolvedReferences = (
  sourceUrl: string,
  references: ResolvedReference[],
  matchedCount: number,
  sourceTitle?: string,
): string => {
  if (references.length === 0) {
    return `No references could be resolved from: ${sourceUrl}`;
  }

  const title =
    sourceTitle || new URL(sourceUrl).pathname.split("/").pop() || "Document";
  let content = `# References from ${title}\n${references.length} references\n`;

  const groupedReferences = groupReferencesByRole(references);

  for (const [role, refs] of Object.entries(groupedReferences)) {
    content += `\n## ${formatRoleTitle(role)} (${refs.length})\n`;

    for (const ref of refs) {
      content += formatSingleReference(ref);
    }
  }

  if (matchedCount > references.length) {
    content += `\nShowing ${references.length} of ${matchedCount}. Narrow with filter, or raise limit.\n`;
  }

  return content.trimEnd();
};

const groupReferencesByRole = (
  references: ResolvedReference[],
): Record<string, ResolvedReference[]> => {
  const groups: Record<string, ResolvedReference[]> = {};

  for (const ref of references) {
    const role = ref.role || "unknown";
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(ref);
  }

  return groups;
};

const formatRoleTitle = (role: string): string => {
  const roleTitles: Record<string, string> = {
    symbol: "API Symbols",
    collection: "Collections",
    article: "Articles",
    sampleCode: "Sample Code",
    overview: "Overviews",
    collectionGroup: "Collection Groups",
    unknown: "Other References",
  };

  return roleTitles[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

const formatSingleReference = (ref: ResolvedReference): string => {
  const signature = (ref.fragments ?? [])
    .map((f) => f.text)
    .join("")
    .trim();
  return `- [${ref.title}](${ref.url})${signature ? ` \`${signature}\`` : ""}${ref.abstract ? `: ${ref.abstract}` : ""}\n`;
};
