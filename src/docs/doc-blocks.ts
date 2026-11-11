import type { RenderBlockContent, RenderNode } from "../types/docc.ts";
import {
	formatIdentifierLine,
	formatImage,
	formatInlineContent,
	hasText,
} from "./doc-formatter.ts";

export type References = RenderNode["references"];

/**
 * Blocks as one line of text, for a list item
 */
export const formatOneLine = (
	blocks: RenderBlockContent[],
	references: References,
): string =>
	formatContentItems(blocks, references)
		.trim()
		.replaceAll(/\s*\n+\s*/gu, " ");

/**
 * Format one block, including the blocks that hold other blocks: a code listing's language tabs (Swift, Objective-C),
 * notes, lists, side-by-side columns, tables, link lists (a HIG page's videos) and tutorial layouts. Blocks of any
 * other type are left out.
 */
const formatBlock = (
	block: RenderBlockContent,
	references: References,
): string => {
	if (!("type" in block)) {
		return formatLayout(block, references);
	}
	if (isUnformatted(block)) {
		return "";
	}
	if (block.type === "heading") {
		return `${"#".repeat(Math.min(Math.max(block.level, 2), 6))} ${block.text}\n\n`;
	}
	if (block.type === "paragraph") {
		const text = formatInlineContent(block.inlineContent, references);
		return text.trim() ? `${text}\n\n` : "";
	}
	if (block.type === "codeListing") {
		return `\`\`\`${block.syntax ?? "swift"}\n${block.code.join("\n")}\n\`\`\`\n\n`;
	}
	if (block.type === "tabNavigator") {
		return block.tabs
			.map(
				(tab) =>
					`**${tab.title}**\n\n${formatContentItems(tab.content, references)}`,
			)
			.join("");
	}
	if (block.type === "aside") {
		const body = formatContentItems(block.content, references)
			.trim()
			.replaceAll("\n", "\n> ");
		return `> **${block.name ?? "Note"}:** ${body}\n\n`;
	}
	if (block.type === "row") {
		return block.columns
			.map((column) => formatContentItems(column.content, references))
			.join("");
	}
	if (block.type === "table") {
		return formatTable(block, references);
	}
	if (block.type === "links") {
		return `${block.items.map((identifier) => formatIdentifierLine(identifier, references)).join("")}\n`;
	}
	return formatList(block, references);
};

type TypedBlock = Extract<RenderBlockContent, { type: string }>;
type UnformattedBlock = Extract<
	TypedBlock,
	{
		type:
			| "dictionaryExample"
			| "endpointExample"
			| "small"
			| "step"
			| "termList"
			| "thematicBreak"
			| "video";
	}
>;

const UNFORMATTED_TYPES: ReadonlySet<string> = new Set([
	"dictionaryExample",
	"endpointExample",
	"small",
	"step",
	"termList",
	"thematicBreak",
	"video",
]);

const isUnformatted = (block: TypedBlock): block is UnformattedBlock =>
	UNFORMATTED_TYPES.has(block.type);

const formatList = (
	block: Extract<TypedBlock, { type: "unorderedList" | "orderedList" }>,
	references: References,
): string => {
	const lines = block.items.map((item, index) => {
		const marker = block.type === "orderedList" ? `${index + 1}.` : "-";
		const text = formatContentItems(item.content, references)
			.trim()
			.replaceAll("\n", "\n  ");
		return `${marker} ${text}`;
	});
	return `${lines.join("\n")}\n\n`;
};

/**
 * A tutorial's layout, which the spec tags with `kind`: full width, columns, or content beside its picture
 */
const formatLayout = (
	block: Exclude<RenderBlockContent, { type: string }>,
	references: References,
): string =>
	"content" in block
		? formatContentItems(block.content, references) +
			formatMedia("media" in block ? block.media : null, references)
		: "";

/**
 * A tutorial step: what to do, the code file as it stands after it, its pictures, and the caption under them
 */
export const formatStep = (
	block: RenderBlockContent,
	references: References,
): string => {
	if (!("type" in block) || block.type !== "step") {
		return formatBlock(block, references);
	}
	return (
		formatContentItems(block.content, references) +
		formatCodeFile(block.code, references) +
		formatMedia(block.media, references) +
		formatMedia(block.runtimePreview, references) +
		formatContentItems(block.caption, references)
	);
};

/**
 * A picture on its own line; a video or a missing reference leaves nothing
 */
const formatMedia = (
	identifier: string | null | undefined,
	references: References,
): string => {
	const image = hasText(identifier) ? formatImage(identifier, references) : "";
	return image ? `${image}\n\n` : "";
};

/**
 * A tutorial step's code: the whole file as it stands after the step
 */
const formatCodeFile = (
	identifier: string | null | undefined,
	references: References,
): string => {
	const file = hasText(identifier) ? references?.[identifier] : undefined;
	return file?.type === "file"
		? `**${file.fileName}**\n\n\`\`\`${file.syntax}\n${file.content.join("\n")}\n\`\`\`\n\n`
		: "";
};

export const formatContentItems = (
	items: RenderBlockContent[],
	references: References,
): string => items.map((item) => formatBlock(item, references)).join("");

/**
 * Format a table in Markdown, each cell's blocks on one line; a table without a header row gets an empty one
 */
const formatTable = (
	table: Extract<RenderBlockContent, { type: "table" }>,
	references: References,
): string => {
	const rows = table.rows.map(
		(row) =>
			`| ${row.map((cell) => formatOneLine(cell, references)).join(" | ")} |`,
	);
	const width = table.rows[0]?.length ?? 0;
	if (width === 0) {
		return "";
	}
	const header =
		table.header === "row" || table.header === "both"
			? rows.shift()
			: `|${" |".repeat(width)}`;
	return `${header}\n|${" --- |".repeat(width)}\n${rows.map((row) => `${row}\n`).join("")}\n`;
};
