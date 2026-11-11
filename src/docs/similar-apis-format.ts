import { SEARCH_DEPTH_LIMITS } from "../core/constants.ts";
import type { RenderNode } from "../types/docc.ts";
import { formatIntroducedVersion } from "./doc-formatter.ts";
import type { SimilarAPI } from "./similar-apis-extract.ts";

const formatPlatformLine = (
	metadata: RenderNode["metadata"] | undefined,
): string => {
	if (metadata === undefined) {
		return "";
	}
	const roleHeading = metadata.roleHeading ?? "";
	const platforms =
		metadata.platforms
			?.map((p) => `${p.name}${formatIntroducedVersion(p)}`)
			.join(", ") ?? "";
	if (!roleHeading && !platforms) {
		return "";
	}
	return `${roleHeading}${platforms ? ` · ${platforms}` : ""}\n\n`;
};

export const formatSimilarApis = (
	originalUrl: string,
	similarApis: SimilarAPI[],
	foundCount: number,
	originalApiName: string,
	originalData: RenderNode,
	deprecationNote: string,
): string => {
	const lastSegment = new URL(originalUrl).pathname.split("/").at(-1) ?? "";
	const apiName = originalApiName || lastSegment || "API";
	let content = `# Similar APIs to ${apiName}\n\n`;
	if (deprecationNote) {
		content += `**Deprecated:** ${deprecationNote}\n\n`;
	}

	if (similarApis.length === 0) {
		content += "No similar APIs found";
		return content;
	}

	content += formatPlatformLine(originalData.metadata);

	content += `${similarApis.length} similar APIs\n`;

	const groupedByCategory = new Map<string, SimilarAPI[]>();

	for (const api of similarApis) {
		const key = `${api.similarityType}: ${api.category}`;
		const group = groupedByCategory.get(key) ?? [];
		group.push(api);
		groupedByCategory.set(key, group);
	}

	for (const [categoryKey, apis] of groupedByCategory) {
		content += `\n## ${categoryKey}\n`;

		for (const api of apis) {
			const abstract = api.abstract ?? "";
			content += `- [${api.title}](${api.url})${abstract ? `: ${abstract}` : ""}\n`;
		}
	}

	if (foundCount > similarApis.length) {
		content += `\n…and ${foundCount - similarApis.length} more\n\nShowing ${similarApis.length} of ${foundCount}. Raise limit or depth (shallow ${SEARCH_DEPTH_LIMITS.shallow}, medium ${SEARCH_DEPTH_LIMITS.medium}, deep ${SEARCH_DEPTH_LIMITS.deep}) to see more.\n`;
	}

	return content.trimEnd();
};
