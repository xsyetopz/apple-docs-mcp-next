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

export async function handleResolveReferencesBatch({
  sourceUrl,
  maxReferences,
  filterByType,
}: ReferencesQuery): Promise<string> {
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
  const limitedReferences = Object.entries(filteredReferences).slice(
    0,
    maxReferences,
  );

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
    data.metadata?.title,
  );
}

function filterReferences(
  references: NonNullable<References>,
  filterByType: string,
): Record<string, TopicRenderReference> {
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
}

async function resolveReference(
  identifier: string,
  refData: TopicRenderReference,
  references: References,
): Promise<ResolvedReference | null> {
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
}

function formatResolvedReferences(
  sourceUrl: string,
  references: ResolvedReference[],
  sourceTitle?: string,
): string {
  if (references.length === 0) {
    return `No references could be resolved from: ${sourceUrl}`;
  }

  const title =
    sourceTitle || new URL(sourceUrl).pathname.split("/").pop() || "Document";
  let content = `# References from ${title}\n\n`;
  content += `**Source:** [${sourceUrl}](${sourceUrl})\n\n`;
  content += `**Resolved ${references.length} references:**\n\n`;

  const groupedReferences = groupReferencesByRole(references);

  for (const [role, refs] of Object.entries(groupedReferences)) {
    content += `## ${formatRoleTitle(role)} (${refs.length})\n\n`;

    for (const ref of refs) {
      content += formatSingleReference(ref);
    }
  }

  content += `---\n\n*Total: ${references.length} references resolved*`;

  return content;
}

function groupReferencesByRole(
  references: ResolvedReference[],
): Record<string, ResolvedReference[]> {
  const groups: Record<string, ResolvedReference[]> = {};

  for (const ref of references) {
    const role = ref.role || "unknown";
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(ref);
  }

  return groups;
}

function formatRoleTitle(role: string): string {
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
}

function formatSingleReference(ref: ResolvedReference): string {
  let content = `### [${ref.title}](${ref.url})\n`;

  if (ref.fragments && ref.fragments.length > 0) {
    const codeSignature = ref.fragments.map((f) => f.text).join("");
    if (codeSignature.trim()) {
      content += `\`\`\`swift\n${codeSignature.trimEnd()}\n\`\`\`\n\n`;
    }
  }

  if (ref.abstract) {
    content += `${ref.abstract}\n\n`;
  }

  const metadata = [];
  if (ref.kind) {
    metadata.push(`Kind: ${ref.kind}`);
  }
  if (metadata.length > 0) {
    content += `*${metadata.join(" | ")}*\n\n`;
  }

  return content;
}
