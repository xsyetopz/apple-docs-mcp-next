import type { RenderNode } from "../types/docc.ts";
import { formatContentItems } from "./doc-blocks.ts";
import { formatWebServiceSection } from "./doc-web-service.ts";

/**
 * Format specific API content (methods, properties, etc.)
 */
export const formatSpecificAPIContent = (jsonData: RenderNode): string => {
	let content = "";
	for (const section of jsonData.primaryContentSections ?? []) {
		if (!("kind" in section)) {
			continue;
		}
		if (section.kind === "declarations") {
			const declaration =
				section.declarations[0]?.tokens.map((token) => token.text).join("") ??
				"";
			content += `## Declaration\n\n\`\`\`swift\n${declaration.trimEnd()}\n\`\`\`\n\n`;
		} else if (section.kind === "parameters") {
			const params = section.parameters
				.map(
					(param) =>
						`**${param.name}**: ${formatContentItems(param.content, jsonData.references).trim()}\n\n`,
				)
				.join("");
			content += `## Parameters\n\n${params}`;
		} else if (section.kind === "content") {
			content += formatContentItems(section.content, jsonData.references);
		} else {
			content += formatWebServiceSection(section, jsonData.references);
		}
	}
	return content;
};

/**
 * Format API collection content (overview + API lists)
 */
export const formatAPICollectionContent = (jsonData: RenderNode): string => {
	let content = "";
	for (const section of jsonData.primaryContentSections ?? []) {
		if ("kind" in section && section.kind === "content") {
			const first = section.content[0];
			const opensWithHeading =
				first !== undefined && "type" in first && first.type === "heading";
			content += opensWithHeading ? "" : "## Overview\n\n";
			content += formatContentItems(section.content, jsonData.references);
		}
	}
	return content;
};
