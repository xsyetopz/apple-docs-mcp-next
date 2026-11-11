import type { PlatformAvailability, RenderNode } from "../types/docc.ts";
import { isDeprecated } from "../types/docc.ts";
import {
	formatIdentifierLine,
	formatInlineContent,
	formatIntroducedVersion,
	hasText,
} from "./doc-formatter.ts";

/**
 * Format document header with title and status
 */
export const formatDocumentHeader = (jsonData: RenderNode): string => {
	const title = jsonData.metadata?.title ?? "Documentation";
	const platforms = jsonData.metadata?.platforms ?? [];
	const statusInfo: string[] = [];
	if (platforms.some((platform) => platform.beta === true)) {
		statusInfo.push("**Beta**");
	}
	if (platforms.some((platform) => isDeprecated(platform))) {
		statusInfo.push("**Deprecated**");
	}
	const statusText = statusInfo.length > 0 ? ` (${statusInfo.join(", ")})` : "";
	return `# ${title}${statusText}\n\n${formatRoleHeading(jsonData)}`;
};

const formatRoleHeading = (jsonData: RenderNode): string => {
	const roleHeading = jsonData.metadata?.roleHeading;
	if (!hasText(roleHeading)) {
		return "";
	}
	const symbolKind = jsonData.metadata?.symbolKind;
	const kind = hasText(symbolKind) ? ` (${symbolKind})` : "";
	return `**${roleHeading}**${kind}\n\n`;
};

/**
 * Format document abstract
 */
export const formatDocumentAbstract = (jsonData: RenderNode): string => {
	const abstractText = formatInlineContent(
		jsonData.abstract ?? [],
		jsonData.references,
	).trim();
	return abstractText === "" ? "" : `${abstractText}\n\n`;
};

/**
 * Format platform availability section
 */
export const formatPlatformAvailability = (jsonData: RenderNode): string => {
	const platforms = jsonData.metadata?.platforms;
	if (platforms === undefined || platforms.length === 0) {
		return "";
	}
	return `## Platform Availability\n\n${platforms.map((platform) => formatPlatformLine(platform)).join("")}\n`;
};

/**
 * Format a single platform line
 */
const formatPlatformLine = (platform: PlatformAvailability): string => {
	const platformStatus: string[] = [];
	if (platform.beta === true) {
		platformStatus.push("Beta");
	}
	if (isDeprecated(platform)) {
		platformStatus.push("Deprecated");
	}
	if (platform.unavailable === true) {
		platformStatus.push("Unavailable");
	}
	let platformLine = `- **${platform.name}**${formatIntroducedVersion(platform)}`;
	if (hasText(platform.deprecatedAt)) {
		platformLine += ` | Deprecated in ${platform.deprecatedAt}`;
	}
	if (platformStatus.length > 0) {
		platformLine += ` | Status: ${platformStatus.join(", ")}`;
	}
	return `${platformLine}\n`;
};

/**
 * Format See Also section
 */
export const formatSeeAlsoSection = (jsonData: RenderNode): string => {
	const groups = (jsonData.seeAlsoSections ?? [])
		.filter(
			(seeAlso) => hasText(seeAlso.title) && seeAlso.identifiers.length > 0,
		)
		.map((seeAlso) => {
			const lines = seeAlso.identifiers
				.map((identifier) =>
					formatIdentifierLine(identifier, jsonData.references),
				)
				.join("");
			return `### ${seeAlso.title}\n\n${lines}\n`;
		});
	return groups.length > 0 ? `## See Also\n\n${groups.join("")}` : "";
};

/**
 * A web-service endpoint has no declaration; its URL is its signature
 */
export const isSpecificAPIDocument = (jsonData: RenderNode): boolean =>
	jsonData.primaryContentSections?.some(
		(section) =>
			"kind" in section &&
			(section.kind === "declarations" || section.kind === "restEndpoint"),
	) ?? false;
