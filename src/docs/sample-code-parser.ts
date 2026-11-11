import type {
	RenderIndex,
	RenderIndexNode,
	RenderNode,
} from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { formatInlineContent, hasText } from "./doc-formatter.ts";
import { normalizeFrameworkName } from "./framework-mapper.ts";

export interface ParsedSampleCode {
	id: string;
	title: string;
	framework?: string | undefined;
	description?: string | undefined;
	beta: boolean;
	featured?: boolean | undefined;
	url: string;
	path: string;
	depth: number;
}

interface NodeContext {
	sampleCodes: ParsedSampleCode[];
	frameworkMap: Map<string, string>;
	featuredIds: Set<string>;
}

/**
 * Parses sample codes from the content and index data
 */
export const parseSampleCodes = (
	content: RenderNode,
	index: RenderIndex,
	names: Map<string, string>,
): ParsedSampleCode[] => {
	const context: NodeContext = {
		sampleCodes: [],
		frameworkMap: new Map(
			(content.topicSections ?? []).flatMap((section) =>
				section.identifiers.map(
					(identifier) => [identifier, section.title ?? ""] as const,
				),
			),
		),
		featuredIds: new Set(
			(content.primaryContentSections ?? []).flatMap((section) =>
				"kind" in section && section.kind === "content"
					? section.content.flatMap((item) =>
							"type" in item && item.type === "links" ? item.items : [],
						)
					: [],
			),
		),
	};
	for (const nodes of Object.values(index.interfaceLanguages)) {
		processSampleCodeNodes(nodes, context, "", 0);
	}

	const summaries = new Map(
		Object.values(content.references ?? {})
			.filter((ref) => isTopicReference(ref))
			.map((ref) => [
				ref.url,
				formatInlineContent(ref.abstract ?? [], content.references).trim(),
			]),
	);

	const codes = deduplicateSampleCodes(context.sampleCodes);
	for (const code of codes) {
		code.framework = names.get(code.path.split("/")[2] ?? "") ?? code.framework;
		code.description = summaries.get(code.path);
	}
	return codes;
};

const deduplicateSampleCodes = (
	sampleCodes: ParsedSampleCode[],
): ParsedSampleCode[] => {
	const uniqueCodes = new Map<string, ParsedSampleCode>();
	for (const code of sampleCodes) {
		const existing = uniqueCodes.get(code.path);
		uniqueCodes.set(
			code.path,
			existing === undefined
				? code
				: {
						...existing,
						framework: hasText(code.framework)
							? code.framework
							: existing.framework,
						featured: code.featured === true || existing.featured,
						beta: code.beta || existing.beta,
						depth: Math.min(code.depth, existing.depth),
					},
		);
	}
	return [...uniqueCodes.values()];
};

const processSampleCodeNodes = (
	nodes: RenderIndexNode[],
	context: NodeContext,
	currentFramework: string,
	depth: number,
): void => {
	for (const node of nodes) {
		if (node.type === "groupMarker") {
			if (node.children) {
				processSampleCodeNodes(
					node.children,
					context,
					normalizeFrameworkName(node.title),
					depth + 1,
				);
			}
		} else if (node.type === "sampleCode" && hasText(node.path)) {
			context.sampleCodes.push(
				toSampleCode(node, node.path, context, currentFramework, depth),
			);
		} else if (node.children) {
			processSampleCodeNodes(
				node.children,
				context,
				currentFramework,
				depth + 1,
			);
		}
	}
};

const toSampleCode = (
	node: RenderIndexNode,
	path: string,
	context: NodeContext,
	currentFramework: string,
	depth: number,
): ParsedSampleCode => {
	const docUrl = `doc://com.apple.documentation${path}`;
	const framework = normalizeFrameworkName(
		[
			extractFrameworkFromPath(path),
			context.frameworkMap.get(docUrl),
			currentFramework,
		].find((candidate) => hasText(candidate)),
	);
	return {
		id: path,
		title: node.title,
		framework: hasText(framework) ? framework : undefined,
		beta: node.beta === true,
		featured: context.featuredIds.has(docUrl),
		url: path,
		path,
		depth,
	};
};

const extractFrameworkFromPath = (path: string): string | undefined => {
	const framework = /^\/documentation\/([^/]+)\//u.exec(path)?.[1];
	return framework === undefined ||
		framework === "samplecode" ||
		framework === "documentation"
		? undefined
		: normalizeFrameworkName(framework);
};
