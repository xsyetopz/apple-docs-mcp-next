import { generateUrlCacheKey, indexCache } from "../core/cache.ts";
import { APPLE_URLS, PROCESSING_LIMITS } from "../core/constants.ts";
import { logger } from "../core/logger.ts";
import type { RenderIndexNode } from "../types/docc.ts";
import { fetchRenderIndex } from "./docc-json.ts";
import { normalizeFrameworkName } from "./framework-mapper.ts";
import { hasText } from "./has-text.ts";
import {
	findCollections,
	formatSymbolItem,
	groupByType,
	matchesPattern,
	pluralizeType,
} from "./symbol-formatting.ts";

const findSymbolsRecursive = (
	items: RenderIndexNode[],
	symbolType: string,
	namePattern: string | undefined,
	limit: number,
	symbols: RenderIndexNode[],
	depth = 0,
): boolean => {
	if (depth > 6) {
		return false;
	}

	for (const item of items) {
		if (symbols.length >= limit) {
			return true;
		}

		// Group markers head the symbols that follow them, and an index can list one symbol under two groups
		if (
			item.type !== "groupMarker" &&
			(symbolType === "all" || item.type === symbolType) &&
			(!hasText(namePattern) || matchesPattern(item.title, namePattern)) &&
			!symbols.some((symbol) => symbol.path === item.path)
		) {
			symbols.push(item);
		}

		if (
			item.children &&
			symbols.length < limit &&
			findSymbolsRecursive(
				item.children,
				symbolType,
				namePattern,
				limit,
				symbols,
				depth + 1,
			)
		) {
			return true;
		}
	}

	return false;
};

export interface FrameworkSymbolsQuery {
	framework: string;
	symbolType: string;
	namePattern?: string | undefined;
	language: "swift" | "occ";
	limit: number;
}

const typeText = (symbolType: string): string =>
	symbolType === "all" ? "symbols" : pluralizeType(symbolType).toLowerCase();

const formatNoSymbols = (
	{ framework, symbolType, namePattern }: FrameworkSymbolsQuery,
	indexItems: RenderIndexNode[],
): string => {
	let result = `No ${typeText(symbolType)} found`;
	if (hasText(namePattern)) {
		result += ` matching pattern "${namePattern}"`;
	}
	result += ` in ${framework} framework.\n`;

	const collections = findCollections(indexItems);
	if (collections.length > 0) {
		result += "\n## Try exploring these collections:\n\n";
		for (const col of collections.slice(
			0,
			PROCESSING_LIMITS.MAX_COLLECTIONS_TO_SHOW,
		)) {
			result += `- [${col.title}](${col.path})\n`;
		}
	}
	return result;
};

const formatSymbols = (
	{ symbolType, namePattern, limit }: FrameworkSymbolsQuery,
	symbols: RenderIndexNode[],
): string => {
	let result = `${symbols.length} ${typeText(symbolType)}`;
	if (hasText(namePattern)) {
		result += ` matching "${namePattern}"`;
	}
	result += "\n";

	if (symbolType === "all") {
		for (const [type, items] of Object.entries(groupByType(symbols))) {
			result += `\n## ${pluralizeType(type)} (${items.length})\n`;
			for (const item of items) {
				result += formatSymbolItem(item);
			}
		}
	} else {
		for (const symbol of symbols) {
			result += formatSymbolItem(symbol);
		}
	}

	if (symbols.length >= limit) {
		result += `\nStopped at the limit of ${limit}, so there may be more. Narrow with namePattern or symbolType, or raise limit.\n`;
	}
	return result;
};

/**
 * Searches a framework's symbols (classes, structs, protocols, and so on).
 */
export const searchFrameworkSymbols = async (
	query: FrameworkSymbolsQuery,
): Promise<string> => {
	const { framework, symbolType, namePattern, language, limit } = query;
	const normalizedFramework = normalizeFrameworkName(framework);
	logger.info(
		`Searching ${symbolType} symbols in ${normalizedFramework} framework`,
	);

	const indexUrl = `${APPLE_URLS.TUTORIALS_DATA}index/${framework.toLowerCase()}`;
	const cacheKey = generateUrlCacheKey(indexUrl, {
		framework: normalizedFramework,
		symbolType,
		namePattern,
		language,
		limit,
	});

	const cachedResult = indexCache.get(cacheKey);
	if (cachedResult !== undefined) {
		return cachedResult;
	}

	const data = await fetchRenderIndex(indexUrl);
	const indexItems = data.interfaceLanguages?.[language] ?? [];

	if (indexItems.length === 0) {
		const availableLanguages = Object.keys(data.interfaceLanguages ?? {});
		return `Language "${language}" not available for ${framework}. Available languages: ${availableLanguages.join(", ")}`;
	}

	const symbols: RenderIndexNode[] = [];
	findSymbolsRecursive(indexItems, symbolType, namePattern, limit, symbols);

	const typeLabel =
		symbolType === "all" ? "Symbols" : pluralizeType(symbolType);
	const result = `# ${framework} Framework ${typeLabel}\n${
		symbols.length === 0
			? formatNoSymbols(query, indexItems)
			: formatSymbols(query, symbols)
	}`.trimEnd();

	indexCache.set(cacheKey, result);

	return result;
};
