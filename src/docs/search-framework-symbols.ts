import { generateUrlCacheKey, indexCache } from "../core/cache.ts";
import {
  API_LIMITS,
  APPLE_URLS,
  PROCESSING_LIMITS,
} from "../core/constants.ts";
import { httpClient } from "../core/http-client.ts";
import { logger } from "../core/logger.ts";
import type { RenderIndex, RenderIndexNode } from "../types/docc.ts";
import { normalizeFrameworkName } from "./framework-mapper.ts";

/**
 * 搜索框架中的符号（类、结构体、协议等）
 */
// Function to find symbols recursively (defined outside to reduce complexity)
function findSymbolsRecursive(
  items: RenderIndexNode[],
  symbolType: string,
  namePattern: string | undefined,
  limit: number,
  symbols: RenderIndexNode[],
  depth: number = 0,
): boolean {
  if (depth > 6) {
    return false;
  }

  for (const item of items) {
    if (symbols.length >= limit) {
      return true; // Limit reached
    }

    // Group markers head the symbols that follow them, and an index can list one symbol under two groups
    if (
      item.type !== "groupMarker" &&
      (symbolType === "all" || item.type === symbolType)
    ) {
      if (
        (!namePattern || matchesPattern(item.title, namePattern)) &&
        !symbols.some((symbol) => symbol.path === item.path)
      ) {
        symbols.push(item);
      }
    }

    if (item.children && symbols.length < limit) {
      const limitReached = findSymbolsRecursive(
        item.children,
        symbolType,
        namePattern,
        limit,
        symbols,
        depth + 1,
      );
      if (limitReached) {
        return true;
      }
    }
  }

  return false;
}

export async function searchFrameworkSymbols(
  framework: string,
  symbolType: string = "all",
  namePattern?: string,
  language: string = "swift",
  limit: number = API_LIMITS.DEFAULT_FRAMEWORK_SYMBOLS_LIMIT,
): Promise<string> {
  try {
    // Normalize framework name for consistent processing
    const normalizedFramework = normalizeFrameworkName(framework);
    logger.info(
      `Searching ${symbolType} symbols in ${normalizedFramework} framework`,
    );

    // 获取框架索引
    const indexUrl = `${APPLE_URLS.TUTORIALS_DATA}index/${framework.toLowerCase()}`;
    const cacheKey = generateUrlCacheKey(indexUrl, {
      framework: normalizedFramework,
      symbolType,
      namePattern,
      language,
      limit,
    });

    // Check cache
    const cachedResult = indexCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const data = await httpClient.getJson<RenderIndex>(indexUrl);

    // Get language-specific index
    const indexItems = data.interfaceLanguages?.[language] || [];

    if (indexItems.length === 0) {
      const availableLanguages = Object.keys(data.interfaceLanguages || {});
      return `Language "${language}" not available for ${framework}. Available languages: ${availableLanguages.join(", ")}`;
    }

    // Find all symbols recursively
    const symbols: RenderIndexNode[] = [];
    findSymbolsRecursive(indexItems, symbolType, namePattern, limit, symbols);

    // Format results
    const typeLabel =
      symbolType === "all" ? "Symbols" : pluralizeType(symbolType);
    let result = `# ${framework} Framework ${typeLabel}\n\n`;

    if (symbols.length === 0) {
      const typeText =
        symbolType === "all"
          ? "symbols"
          : pluralizeType(symbolType).toLowerCase();
      result += `No ${typeText} found`;
      if (namePattern) {
        result += ` matching pattern "${namePattern}"`;
      }
      result += ` in ${framework} framework.\n`;

      // Suggest exploring collections
      const collections = findCollections(indexItems);
      if (collections.length > 0) {
        result += "\n## Try exploring these collections:\n\n";
        for (const col of collections.slice(
          0,
          PROCESSING_LIMITS.MAX_COLLECTIONS_TO_SHOW,
        )) {
          result += `- [${col.title}](https://developer.apple.com${col.path})\n`;
        }
      }
    } else {
      result += `**Found:** ${symbols.length} ${symbolType === "all" ? "symbols" : pluralizeType(symbolType).toLowerCase()}`;
      if (namePattern) {
        result += ` matching "${namePattern}"`;
      }
      result += "\n\n";

      // Group by type if searching all
      if (symbolType === "all") {
        const grouped = groupByType(symbols);
        for (const [type, items] of Object.entries(grouped)) {
          result += `## ${pluralizeType(type)} (${items.length})\n\n`;
          for (const item of items) {
            result += formatSymbolItem(item);
          }
          result += "\n";
        }
      } else {
        // List symbols
        for (const symbol of symbols) {
          result += formatSymbolItem(symbol);
        }
      }
    }

    // Cache result
    indexCache.set(cacheKey, result);

    return result;
  } catch (error) {
    return `Error searching classes: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function formatSymbolItem(item: RenderIndexNode): string {
  const url = `https://developer.apple.com${item.path ?? ""}`;
  let result = `- [**${item.title}**](${url})`;

  const metadata = [];
  if (item.beta) {
    metadata.push("Beta");
  }
  if (item.deprecated) {
    metadata.push("Deprecated");
  }
  if (item.type && item.type !== "groupMarker") {
    metadata.push(formatTypeLabel(item.type));
  }

  if (metadata.length > 0) {
    result += ` *(${metadata.join(", ")})*`;
  }

  return `${result}\n`;
}

function groupByType(
  symbols: RenderIndexNode[],
): Record<string, RenderIndexNode[]> {
  const groups: Record<string, RenderIndexNode[]> = {};

  for (const symbol of symbols) {
    const type = symbol.type ?? "other";
    groups[type] = [...(groups[type] ?? []), symbol];
  }

  return groups;
}

function formatTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    symbol: "Symbol",
    module: "Module",
    class: "Class",
    struct: "Struct",
    enum: "Enum",
    protocol: "Protocol",
    method: "Method",
    property: "Property",
    init: "Initializer",
    case: "Case",
    associatedtype: "Associated Type",
    typealias: "Type Alias",
    article: "Article",
    sampleCode: "Sample Code",
    overview: "Overview",
    collection: "Collection",
    func: "Function",
    var: "Variable",
    let: "Constant",
    operator: "Operator",
    macro: "Macro",
    namespace: "Namespace",
  };

  return typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function pluralizeType(type: string): string {
  const typeLabel = formatTypeLabel(type);

  // Special cases for pluralization
  const pluralRules: Record<string, string> = {
    Class: "Classes",
    Property: "Properties",
    "Associated Type": "Associated Types",
    "Type Alias": "Type Aliases",
    "Sample Code": "Sample Code",
  };

  return pluralRules[typeLabel] || `${typeLabel}s`;
}

function matchesPattern(name: string, pattern: string): boolean {
  const regexPattern = pattern
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");

  const regex = new RegExp(`^${regexPattern}$`, "i");
  return regex.test(name);
}

function findCollections(items: RenderIndexNode[]): RenderIndexNode[] {
  const collections: RenderIndexNode[] = [];

  function search(itemList: RenderIndexNode[]) {
    for (const item of itemList) {
      if (item.type === "collection") {
        collections.push(item);
      }
      if (item.children) {
        search(item.children);
      }
    }
  }

  search(items);
  return collections;
}
