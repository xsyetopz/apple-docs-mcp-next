import { PROCESSING_LIMITS } from "../core/constants.ts";
import type { RenderNode } from "../types/docc.ts";
import {
	formatIdentifierLine,
	formatIdentifierLink,
	formatInlineContent,
	hasText,
} from "./doc-formatter.ts";
import {
	formatDocumentAbstract,
	formatDocumentHeader,
	formatPlatformAvailability,
	formatSeeAlsoSection,
	isSpecificAPIDocument,
} from "./doc-page-parts.ts";
import {
	formatAPICollectionContent,
	formatSpecificAPIContent,
} from "./doc-primary.ts";
import { formatTutorialSections } from "./doc-tutorial.ts";

/**
 * Collapse each run of blank lines to one and drop trailing ones, outside code fences
 */
const collapseBlankLines = (markdown: string): string =>
	markdown
		.split("```")
		.map((part, index) =>
			index % 2 === 0 ? part.replaceAll(/\n{3,}/gu, "\n\n") : part,
		)
		.join("```")
		.trimEnd();

/**
 * A page as Markdown; a page past the limit lists its Topics members without their summaries, which are most of a
 * large type's page, so that Claude Code keeps the result in the conversation rather than in a file
 */
export const formatPage = (jsonData: RenderNode): string => {
	const page = formatJsonDocumentation(jsonData, true);
	return page.length <= PROCESSING_LIMITS.MAX_PAGE_CHARS
		? page
		: formatJsonDocumentation(jsonData, false);
};

/**
 * Format JSON documentation content
 */
const formatJsonDocumentation = (
	jsonData: RenderNode,
	summaries: boolean,
): string => {
	const body = isSpecificAPIDocument(jsonData)
		? formatSpecificAPIContent(jsonData)
		: formatAPICollectionContent(jsonData);
	return collapseBlankLines(
		formatDocumentHeader(jsonData) +
			formatDocumentAbstract(jsonData) +
			formatSampleDownload(jsonData) +
			body +
			formatTopicsSection(jsonData, summaries) +
			formatTutorialSections(jsonData) +
			formatRelationshipsSection(jsonData) +
			formatPlatformAvailability(jsonData) +
			formatSeeAlsoSection(jsonData),
	);
};

/**
 * A sample's Download button: a reference to the project's zip, linked like any reference
 */
const formatSampleDownload = (jsonData: RenderNode): string => {
	const action = jsonData.sampleCodeDownload?.action;
	return action === undefined
		? ""
		: `${formatInlineContent([action], jsonData.references)}\n\n`;
};

/**
 * A page's Topics: Apple's groups of its members (a type's) or collections (a framework's), under the heading
 * Apple's renderer gives them, swift-docc-render's `sections.topics` string; the page's JSON has only each group's title.
 */
const formatTopicsSection = (
	jsonData: RenderNode,
	summaries: boolean,
): string => {
	const topics = formatTopicGroups(jsonData, summaries);
	if (topics === "") {
		return "";
	}
	const note = summaries
		? ""
		: 'Members without summaries, to keep this long page short; get_api_relations kind "related" lists them with summaries.\n\n';
	return `## Topics\n\n${note}${topics}`;
};

/**
 * Each Topics group's title, its description when it has one, and the pages in it, as links
 */
const formatTopicGroups = (jsonData: RenderNode, summaries: boolean): string =>
	(jsonData.topicSections ?? [])
		.filter(
			(section) => hasText(section.title) && section.identifiers.length > 0,
		)
		.map((section) => {
			const description =
				section.abstract === undefined
					? ""
					: `${formatInlineContent(section.abstract, jsonData.references).trim()}\n\n`;
			const lines = section.identifiers
				.map((identifier) =>
					formatIdentifierLine(identifier, jsonData.references, summaries),
				)
				.join("");
			return `### ${section.title}\n\n${description}${lines}\n`;
		})
		.join("");

/**
 * The page's Relationships (Conforms To, Inherits From, Inherited By, Conforming Types), each type by name as Apple's
 * pages list them
 */
const formatRelationshipsSection = (jsonData: RenderNode): string => {
	const groups = (jsonData.relationshipsSections ?? [])
		.filter((section) => section.identifiers.length > 0)
		.map((section) => {
			const lines = section.identifiers
				.map(
					(identifier) =>
						`- ${formatIdentifierLink(identifier, jsonData.references)}\n`,
				)
				.join("");
			return `### ${section.title}\n\n${lines}\n`;
		});
	return groups.length > 0 ? `## Relationships\n\n${groups.join("")}` : "";
};
