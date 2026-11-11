import { PROCESSING_LIMITS } from "../core/constants.ts";
import type {
	RenderBlockContent,
	RenderInlineContent,
	RenderNode,
	TasksGroupSection,
} from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { formatInlineContent } from "./doc-formatter.ts";

export interface SimilarAPI {
	title: string;
	url: string;
	identifier: string;
	abstract?: string | undefined;
	category: string;
	similarityType: string;
	symbolKind?: string;
	/** Similarity score, out of 10 */
	confidence: number;
}

export type References = RenderNode["references"];

const createSimilarApi = (
	identifier: string,
	category: string,
	similarityType: string,
	confidence: number,
	references: References,
): SimilarAPI | null => {
	const ref = references?.[identifier];
	if (isTopicReference(ref)) {
		return {
			title: ref.title,
			url: ref.url,
			identifier,
			abstract: ref.abstract
				? formatInlineContent(ref.abstract, references).trim()
				: undefined,
			category,
			similarityType,
			symbolKind: ref.kind,
			confidence,
		};
	}

	if (identifier.startsWith("doc://")) {
		const apiName = identifier.split("/").at(-1) ?? "";
		const pathPart = identifier.replace(/^doc:\/\/[^/]+\/documentation\//u, "");

		return {
			title: apiName || "Unknown",
			url: `/documentation/${pathPart}`,
			identifier,
			category,
			similarityType,
			confidence: confidence - 1,
		};
	}

	return null;
};

/** The inline content of each paragraph among blocks */
export const paragraphsOf = (
	blocks: RenderBlockContent[],
): RenderInlineContent[][] =>
	blocks.flatMap((block) =>
		"type" in block && block.type === "paragraph" ? [block.inlineContent] : [],
	);

/** The pages a deprecation note links, first among the similar APIs */
export const replacementsIn = (
	deprecation: RenderBlockContent[],
	references: References,
): SimilarAPI[] =>
	paragraphsOf(deprecation)
		.flat()
		.flatMap((inline) =>
			inline.type === "reference"
				? [
						createSimilarApi(
							inline.identifier,
							"Named in the deprecation note",
							"Replacement",
							10,
							references,
						),
					]
				: [],
		)
		.filter((api): api is SimilarAPI => api !== null);

const extractFromSections = (
	sections: TasksGroupSection[],
	references: References,
	filterByCategory: string | undefined,
	similarityType: string,
	confidence: number,
	maxIdentifiers: number,
): SimilarAPI[] => {
	const filter = (filterByCategory ?? "").toLowerCase();

	return sections
		.filter(
			(section) =>
				filter === "" || (section.title ?? "").toLowerCase().includes(filter),
		)
		.flatMap((section) =>
			section.identifiers.slice(0, maxIdentifiers).flatMap((identifier) => {
				const api = createSimilarApi(
					identifier,
					section.title ?? "",
					similarityType,
					confidence,
					references,
				);
				return api === null ? [] : [api];
			}),
		);
};

export const extractSeeAlsoApis = (
	seeAlsoSections: TasksGroupSection[],
	references: References,
	filterByCategory?: string,
): SimilarAPI[] =>
	extractFromSections(
		seeAlsoSections,
		references,
		filterByCategory,
		"See Also",
		8,
		Infinity,
	);

export const extractTopicApis = (
	topicSections: TasksGroupSection[],
	references: References,
	filterByCategory?: string,
): SimilarAPI[] =>
	extractFromSections(
		topicSections,
		references,
		filterByCategory,
		"Topic Group",
		6,
		PROCESSING_LIMITS.MAX_TOPIC_IDENTIFIERS,
	);

export const deduplicateAndScore = (apis: SimilarAPI[]): SimilarAPI[] => {
	const apiMap = new Map<string, SimilarAPI>();

	for (const api of apis) {
		const existing = apiMap.get(api.identifier);
		if (!existing || api.confidence > existing.confidence) {
			apiMap.set(api.identifier, api);
		}
	}

	return [...apiMap.values()];
};
