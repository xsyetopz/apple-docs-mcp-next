import { PROCESSING_LIMITS } from "../core/constants.ts";
import { logger } from "../core/logger.ts";
import type { RenderNode } from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { formatInlineContent } from "./doc-formatter.ts";
import { fetchRenderNode } from "./docc-json.ts";
import { convertToJsonApiUrl } from "./url-converter.ts";

interface RelatedAPI {
	title: string;
	url: string;
	identifier: string;
	relationship: string;
	abstract?: string | undefined;
}

type References = RenderNode["references"];

/** The relationship prefix of a Topics section's members, before the section's title */
const TOPICS = "Topics: ";

export interface RelatedApisQuery {
	apiUrl: string;
	includeInherited: boolean;
	includeConformance: boolean;
	includeSeeAlso: boolean;
	limit: number;
}

export const handleGetRelatedApis = async ({
	apiUrl,
	includeInherited,
	includeConformance,
	includeSeeAlso,
	limit,
}: RelatedApisQuery): Promise<string> => {
	logger.info(`Fetching related APIs for: ${apiUrl}`);

	const jsonApiUrl = convertToJsonApiUrl(apiUrl);

	if (jsonApiUrl === null) {
		throw new Error("Invalid Apple Developer Documentation URL");
	}

	const data = await fetchRenderNode(jsonApiUrl);
	const included = new Set<string>();
	if (includeInherited) {
		included.add("inheritsFrom").add("inheritedBy");
	}
	if (includeConformance) {
		included.add("conformsTo").add("conformingTypes");
	}

	const relatedApis: RelatedAPI[] = (data.relationshipsSections ?? [])
		.filter((section) => included.has(section.type))
		.flatMap((section) =>
			apisOf(section.identifiers, section.title, data.references),
		);

	if (includeSeeAlso) {
		for (const section of data.seeAlsoSections ?? []) {
			relatedApis.push(
				...apisOf(section.identifiers, "See Also", data.references),
			);
		}
	}

	const topicsLeftOut = collectTopics(data, relatedApis);

	return formatRelatedApis(
		apiUrl,
		deduplicateApis(relatedApis),
		limit,
		topicsLeftOut,
	);
};

const collectTopics = (
	data: RenderNode,
	relatedApis: RelatedAPI[],
): Map<string, number> => {
	const topicsLeftOut = new Map<string, number>();
	for (const section of data.topicSections ?? []) {
		if (section.identifiers.length > 0) {
			const kept = section.identifiers.slice(
				0,
				PROCESSING_LIMITS.MAX_RELATED_APIS_PER_SECTION,
			);
			const relationship = `${TOPICS}${section.title ?? ""}`;
			relatedApis.push(...apisOf(kept, relationship, data.references));
			topicsLeftOut.set(relationship, section.identifiers.length - kept.length);
		}
	}
	return topicsLeftOut;
};

const apisOf = (
	identifiers: string[],
	relationship: string,
	references: References,
): RelatedAPI[] =>
	identifiers.flatMap((identifier) => {
		const api = extractApiFromIdentifier(identifier, relationship, references);
		return api === null ? [] : [api];
	});

const extractApiFromIdentifier = (
	identifier: string,
	relationship: string,
	references: References,
): RelatedAPI | null => {
	const ref = references?.[identifier];
	if (isTopicReference(ref)) {
		return {
			title: ref.title,
			url: ref.url,
			identifier,
			relationship,
			abstract: ref.abstract
				? formatInlineContent(ref.abstract, references).trim()
				: undefined,
		};
	}

	if (identifier.startsWith("doc://")) {
		const apiName = identifier.split("/").at(-1) ?? "";
		const pathPart = identifier.replace(/^doc:\/\/[^/]+\/documentation\//u, "");

		return {
			title: apiName || "Unknown",
			url: `/documentation/${pathPart}`,
			identifier,
			relationship,
		};
	}

	return null;
};

const deduplicateApis = (apis: RelatedAPI[]): RelatedAPI[] => {
	const seen = new Set<string>();
	return apis.filter((api) => {
		if (seen.has(api.identifier)) {
			return false;
		}
		seen.add(api.identifier);
		return true;
	});
};

const formatTopicsLine = (
	relationship: string,
	apis: RelatedAPI[],
	leftOut: number,
): string => {
	const links = apis.map((api) => `[${api.title}](${api.url})`).join(", ");
	const more = leftOut > 0 ? `, +${leftOut} more` : "";
	return `- ${relationship.slice(TOPICS.length) || "Other"}: ${links}${more}\n`;
};

const formatRelatedApis = (
	originalUrl: string,
	relatedApis: RelatedAPI[],
	limit: number,
	topicsLeftOut: Map<string, number>,
): string => {
	if (relatedApis.length === 0) {
		return `No related APIs found for: ${originalUrl}`;
	}

	const lastSegment = new URL(originalUrl).pathname.split("/").at(-1) ?? "";
	const apiName = lastSegment || "API";
	let content = `# Related APIs for ${apiName}\n${relatedApis.length} related APIs\n`;
	let capped = false;
	let topicsHeading = false;

	for (const [relationship, apis] of groupApisByRelationship(relatedApis)) {
		if (relationship.startsWith(TOPICS)) {
			if (!topicsHeading) {
				content += "\n## Topics\n";
				topicsHeading = true;
			}
			content += formatTopicsLine(
				relationship,
				apis,
				topicsLeftOut.get(relationship) ?? 0,
			);
			continue;
		}

		content += `\n## ${relationship}\n`;

		for (const api of apis.slice(0, limit)) {
			const abstract = api.abstract ?? "";
			content += `- [${api.title}](${api.url})${abstract ? `: ${abstract}` : ""}\n`;
		}
		if (apis.length > limit) {
			capped = true;
			content += `…and ${apis.length - limit} more\n`;
		}
	}

	if (capped) {
		content += `\nShowing ${limit} per group. Raise limit to see more.\n`;
	}

	return content.trimEnd();
};

const groupApisByRelationship = (
	apis: RelatedAPI[],
): Map<string, RelatedAPI[]> => {
	const groups = new Map<string, RelatedAPI[]>();

	for (const api of apis) {
		const group = groups.get(api.relationship) ?? [];
		group.push(api);
		groups.set(api.relationship, group);
	}

	return groups;
};
