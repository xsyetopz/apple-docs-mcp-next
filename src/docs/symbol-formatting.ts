import type { RenderIndexNode } from "../types/docc.ts";

const TYPE_LABELS: Record<string, string> = {
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

const PLURALS: Record<string, string> = {
	Class: "Classes",
	Property: "Properties",
	"Associated Type": "Associated Types",
	"Type Alias": "Type Aliases",
	"Sample Code": "Sample Code",
};

/**
 * A symbol as a Markdown list item, marked Beta or Deprecated
 */
export const formatSymbolItem = (item: RenderIndexNode): string => {
	const url = item.path ?? "";
	let result = `- [${item.title}](${url})`;

	const metadata = [];
	if (item.beta === true) {
		metadata.push("Beta");
	}
	if (item.deprecated === true) {
		metadata.push("Deprecated");
	}

	if (metadata.length > 0) {
		result += ` (${metadata.join(", ")})`;
	}

	return `${result}\n`;
};

/**
 * The symbols by their type, `other` for one without
 */
export const groupByType = (
	symbols: RenderIndexNode[],
): Record<string, RenderIndexNode[]> => {
	const groups: Record<string, RenderIndexNode[]> = {};

	for (const symbol of symbols) {
		const type = symbol.type ?? "other";
		groups[type] = [...(groups[type] ?? []), symbol];
	}

	return groups;
};

const formatTypeLabel = (type: string): string =>
	TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);

/**
 * The plural of a type's label
 */
export const pluralizeType = (type: string): string => {
	const typeLabel = formatTypeLabel(type);
	return PLURALS[typeLabel] ?? `${typeLabel}s`;
};

/**
 * Whether a name matches a pattern whose `*` is any run of characters, in any case
 */
export const matchesPattern = (name: string, pattern: string): boolean => {
	const regexPattern = pattern
		.split("*")
		.map((part) => part.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`))
		.join(".*");

	return new RegExp(`^${regexPattern}$`, "iu").test(name);
};

/**
 * Every collection in the tree
 */
export const findCollections = (
	items: RenderIndexNode[],
): RenderIndexNode[] => {
	const collections: RenderIndexNode[] = [];

	const search = (itemList: RenderIndexNode[]) => {
		for (const item of itemList) {
			if (item.type === "collection") {
				collections.push(item);
			}
			if (item.children) {
				search(item.children);
			}
		}
	};

	search(items);
	return collections;
};
