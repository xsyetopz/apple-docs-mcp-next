import {
  generateUrlCacheKey,
  technologyOverviewsCache,
} from "../core/cache.ts";
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

/** One collection or article, in the tree's order, with what encloses it */
interface OverviewEntry {
  title: string;
  path: string;
  slug: string;
  type: string;
  depth: number;
  group: string;
  abstract: string;
  ancestors: string[];
  parentTitle: string;
}

interface OverviewFilters {
  category?: string | undefined;
  searchQuery?: string | undefined;
  includeSubcategories: boolean;
  limit: number;
}

const TYPE_LABELS: Record<string, string> = {
  collection: "Collection",
  article: "Article",
};
const NOTHING_FOUND =
  "No technology overviews found matching the specified criteria.";

export interface TechnologyOverviewsQuery {
  category?: string | undefined;
  searchQuery?: string | undefined;
  includeSubcategories: boolean;
  limit: number;
}

/**
 * Handle get technology overviews
 */
export const handleGetTechnologyOverviews = async ({
  category,
  searchQuery,
  includeSubcategories,
  limit,
}: TechnologyOverviewsQuery): Promise<string> => {
  logger.info("Fetching technology overviews...");

  const cacheKey = generateUrlCacheKey("technology-overviews", {
    category,
    searchQuery,
    includeSubcategories,
    limit,
  });

  const cachedResult = technologyOverviewsCache.get(cacheKey);
  if (cachedResult) {
    logger.debug("Technology overviews cache hit");
    return cachedResult;
  }

  const [overviewsData, overviewsIndex] = await Promise.all([
    httpClient.getJson<RenderNode>(APPLE_URLS.TECHNOLOGY_OVERVIEWS_JSON),
    httpClient.getJson<RenderIndex>(APPLE_URLS.TECHNOLOGY_OVERVIEWS_INDEX_JSON),
  ]);

  const result = formatOverviews(entriesOf(overviewsData, overviewsIndex), {
    category,
    searchQuery,
    includeSubcategories,
    limit,
  });

  technologyOverviewsCache.set(cacheKey, result);

  return result;
};

/**
 * Every collection and article under the tree's root, the Technology Overviews page itself
 */
const entriesOf = (data: RenderNode, index: RenderIndex): OverviewEntry[] => {
  const abstracts = new Map(
    Object.values(data.references ?? {})
      .filter(isTopicReference)
      .map((ref) => [
        ref.url,
        formatInlineContent(ref.abstract ?? [], data.references).trim(),
      ]),
  );
  const roots = index.interfaceLanguages?.["swift"] ?? [];
  return flatten(
    roots.flatMap((root) => root.children ?? []),
    0,
    [],
    "",
    abstracts,
  );
};

const flatten = (
  nodes: RenderIndexNode[],
  depth: number,
  ancestors: string[],
  parentTitle: string,
  abstracts: Map<string, string>,
): OverviewEntry[] => {
  let group = "";
  return nodes.flatMap((node) => {
    if (node.type === "groupMarker") {
      group = node.title;
      return [];
    }
    const path = node.path ?? "";
    const entry: OverviewEntry = {
      title: node.title,
      path,
      slug: path.split("/").pop() ?? "",
      type: node.type ?? "",
      depth,
      group,
      abstract: abstracts.get(path) ?? "",
      ancestors,
      parentTitle,
    };
    return [
      entry,
      ...flatten(
        node.children ?? [],
        depth + 1,
        [...ancestors, path],
        node.title,
        abstracts,
      ),
    ];
  });
};

/**
 * The entries the filters keep, at most `limit` of them: as the tree, or as a flat list when text was searched for
 */
const formatOverviews = (
  all: OverviewEntry[],
  filters: OverviewFilters,
): string => {
  if (all.length === 0) {
    return NOTHING_FOUND;
  }
  const wanted = filters.category?.toLowerCase();
  const root = wanted
    ? all.find(
        (entry) =>
          entry.slug.toLowerCase() === wanted ||
          entry.title.toLowerCase() === wanted.replace(/-/g, " "),
      )
    : undefined;
  if (wanted && !root) {
    const categories = all
      .filter((entry) => entry.type === "collection")
      .map((entry) => entry.slug);
    return `No technology overview matches category "${filters.category}". Categories: ${categories.join(", ")}.`;
  }
  const terms = filters.searchQuery ? [filters.searchQuery.toLowerCase()] : [];
  const matching = all
    .filter(
      (entry) => !root || entry === root || entry.ancestors.includes(root.path),
    )
    .filter((entry) => filters.includeSubcategories || entry.type !== "article")
    .filter((entry) =>
      terms.every((term) =>
        `${entry.title} ${entry.abstract} ${entry.path}`
          .toLowerCase()
          .includes(term),
      ),
    );
  const shown = matching.slice(0, filters.limit);
  if (shown.length === 0) {
    return NOTHING_FOUND;
  }
  const body =
    terms.length > 0 ? flatList(shown) : tree(shown, root?.depth ?? 0);
  const capped =
    matching.length > shown.length
      ? `\n\nShowing ${shown.length} of ${matching.length}. Narrow with category or searchQuery, or raise limit.`
      : "";
  return `# Apple Developer Technology Overviews\n${matching.length} entries\n\n${body}${capped}`;
};

/**
 * Top entries as list items under their group's heading; the ones inside them as nested lists under their group's name
 */
const tree = (entries: OverviewEntry[], base: number): string => {
  const lines: string[] = [];
  let heading = "";
  let label = "";
  for (const entry of entries) {
    const depth = entry.depth - base;
    if (depth === 0) {
      if (entry.group && entry.group !== heading) {
        heading = entry.group;
        lines.push(`## ${heading}`);
      }
      lines.push(
        `- [${entry.title}](${urlOf(entry)}) *(${typeOf(entry)})*${entry.abstract ? ` — ${entry.abstract}` : ""}`,
      );
      label = "";
      continue;
    }
    const indent = "  ".repeat(depth - 1);
    const place = `${entry.ancestors.join(">")}|${entry.group}`;
    if (entry.group && place !== label) {
      lines.push(`${indent}**${entry.group}**`);
    }
    label = place;
    lines.push(
      `${indent}- [${entry.title}](${urlOf(entry)}) *(${typeOf(entry)})*${entry.abstract ? ` — ${entry.abstract}` : ""}`,
    );
  }
  return lines.join("\n").trim();
};

const flatList = (entries: OverviewEntry[]): string => {
  return entries
    .map(
      (entry) =>
        `- [${entry.title}](${urlOf(entry)}) *(${typeOf(entry)})*` +
        `${entry.parentTitle ? ` — in ${entry.parentTitle}` : ""}${entry.abstract ? `: ${entry.abstract}` : ""}`,
    )
    .join("\n");
};

const urlOf = (entry: OverviewEntry): string => {
  return entry.path;
};

const typeOf = (entry: OverviewEntry): string => {
  return TYPE_LABELS[entry.type] ?? entry.type;
};
