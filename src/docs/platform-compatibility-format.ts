import type { PlatformAvailability } from "../types/docc.ts";
import { isDeprecated } from "../types/docc.ts";

export interface CompatibilityAnalysis {
	apiName: string;
	apiUrl: string;
	platforms: PlatformAvailability[];
	supportedPlatforms: string[];
	betaPlatforms: string[];
	deprecatedPlatforms: string[];
	minVersions: Record<string, string>;
	crossPlatformSupport: boolean;
}

export const analyzeCompatibility = (
	apiName: string,
	apiUrl: string,
	platforms: PlatformAvailability[],
): CompatibilityAnalysis => {
	const supportedPlatforms: string[] = [];
	const betaPlatforms: string[] = [];
	const deprecatedPlatforms: string[] = [];
	const minVersions: Record<string, string> = {};

	for (const platform of platforms) {
		const name = platform.name ?? "";
		if (!name) {
			continue;
		}
		supportedPlatforms.push(name);

		if (platform.beta === true) {
			betaPlatforms.push(name);
		}

		if (isDeprecated(platform)) {
			deprecatedPlatforms.push(name);
		}

		const introducedAt = platform.introducedAt ?? "";
		if (introducedAt) {
			minVersions[name] = introducedAt;
		}
	}

	return {
		apiName,
		apiUrl,
		platforms,
		supportedPlatforms,
		betaPlatforms,
		deprecatedPlatforms,
		minVersions,
		crossPlatformSupport: supportedPlatforms.length > 1,
	};
};

const formatPlatform = (platform: PlatformAvailability): string => {
	let content = `**${platform.name}**\n`;

	const introducedAt = platform.introducedAt ?? "";
	if (introducedAt) {
		content += `- Introduced: ${introducedAt}\n`;
	}

	const deprecatedAt = platform.deprecatedAt ?? "";
	if (deprecatedAt) {
		content += `- Deprecated: ${deprecatedAt}\n`;
	}

	const status = [];
	if (platform.beta === true) {
		status.push("Beta");
	}
	if (isDeprecated(platform)) {
		status.push("Deprecated");
	}
	if (platform.unavailable === true) {
		status.push("Unavailable");
	}

	if (status.length > 0) {
		content += `- Status: ${status.join(", ")}\n`;
	}

	const message = platform.message ?? "";
	if (message) {
		content += `- Note: ${message}\n`;
	}

	return `${content}\n`;
};

const formatRecommendations = (analysis: CompatibilityAnalysis): string => {
	let content = "## Compatibility Recommendations\n\n";

	const deprecatedEverywhere =
		analysis.supportedPlatforms.length > 0 &&
		analysis.deprecatedPlatforms.length === analysis.supportedPlatforms.length;
	if (deprecatedEverywhere) {
		content +=
			'⚠️ **Deprecated** on every platform it supports - get_api_relations kind "similar" lists the replacements Apple names\n\n';
	} else if (analysis.crossPlatformSupport) {
		content += `✅ **Cross-platform compatible** - This API works across ${analysis.supportedPlatforms.length} platforms\n\n`;
	} else {
		content += `⚠️ **Platform-specific** - This API is only available on ${analysis.supportedPlatforms[0]}\n\n`;
	}

	if (analysis.betaPlatforms.length > 0) {
		content +=
			"🚧 **Beta platforms** - Some platforms are in beta, expect changes\n\n";
	}

	if (analysis.deprecatedPlatforms.length > 0 && !deprecatedEverywhere) {
		content += `⚠️ **Deprecated on** ${analysis.deprecatedPlatforms.join(", ")} - Consider migration plans for those platforms\n\n`;
	}

	return content;
};

export const formatCompatibilityAnalysis = (
	analysis: CompatibilityAnalysis,
	isRelated = false,
): string => {
	const prefix = isRelated ? "### " : "# ";
	let content = `${prefix}Platform Compatibility: ${analysis.apiName}\n\n`;

	if (!isRelated) {
		content += `**API:** [${analysis.apiUrl}](${analysis.apiUrl})\n\n`;
	}

	content += "## Platform Support Summary\n\n";
	content += `**Supported Platforms:** ${analysis.supportedPlatforms.join(", ")}\n`;
	content += `**Cross-Platform:** ${analysis.crossPlatformSupport ? "Yes" : "No"}\n`;

	if (analysis.betaPlatforms.length > 0) {
		content += `**Beta Platforms:** ${analysis.betaPlatforms.join(", ")}\n`;
	}

	if (analysis.deprecatedPlatforms.length > 0) {
		content += `**Deprecated Platforms:** ${analysis.deprecatedPlatforms.join(", ")}\n`;
	}

	content += "\n## Detailed Platform Information\n\n";
	content += analysis.platforms.map(formatPlatform).join("");
	content += formatRecommendations(analysis);

	if (Object.keys(analysis.minVersions).length > 0) {
		content += "## Minimum Version Requirements\n\n";
		for (const [platform, version] of Object.entries(analysis.minVersions)) {
			content += `- **${platform}:** ${version}+\n`;
		}
		content += "\n";
	}

	return content;
};
