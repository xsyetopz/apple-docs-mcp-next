import { PROCESSING_LIMITS } from "../core/constants.ts";
import { logger } from "../core/logger.ts";
import type { RenderNode } from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { fetchRenderNode } from "./docc-json.ts";
import {
	analyzeCompatibility,
	type CompatibilityAnalysis,
	formatCompatibilityAnalysis,
} from "./platform-compatibility-format.ts";
import { convertToJsonApiUrl } from "./url-converter.ts";

export interface PlatformCompatibilityQuery {
	apiUrl: string;
	compareMode: "single" | "framework";
	includeRelated: boolean;
}

const MAX_RELATED = 3;

export const handleGetPlatformCompatibility = async ({
	apiUrl,
	compareMode,
	includeRelated,
}: PlatformCompatibilityQuery): Promise<string> => {
	logger.info(`Analyzing platform compatibility for: ${apiUrl}`);

	const result = await analyzeSingleApiCompatibility(
		apiUrl,
		compareMode === "framework" || includeRelated,
	);
	return result;
};

const analyzeSingleApiCompatibility = async (
	apiUrl: string,
	includeRelated: boolean,
): Promise<string> => {
	const jsonApiUrl = convertToJsonApiUrl(apiUrl);

	if (jsonApiUrl === null) {
		throw new Error("Invalid Apple Developer Documentation URL");
	}

	const data = await fetchRenderNode(jsonApiUrl);

	if (!data.metadata?.platforms) {
		return `No platform information available for: ${apiUrl}`;
	}

	const analysis = analyzeCompatibility(
		data.metadata.title || "Unknown API",
		apiUrl,
		data.metadata.platforms,
	);

	let result = formatCompatibilityAnalysis(analysis);

	if (includeRelated && data.topicSections) {
		const relatedAnalyses = await analyzeRelatedCompatibility(data);
		if (relatedAnalyses.length > 0) {
			result += "\n\n## Related APIs Compatibility\n\n";
			for (const relatedAnalysis of relatedAnalyses) {
				result += `${formatCompatibilityAnalysis(relatedAnalysis, true)}\n`;
			}
		}
	}

	return result;
};

const analyzeRelatedApi = async (
	identifier: string,
	data: RenderNode,
): Promise<CompatibilityAnalysis | null> => {
	const ref = data.references?.[identifier];
	if (!isTopicReference(ref)) {
		return null;
	}
	try {
		const relatedUrl = `https://developer.apple.com${ref.url}`;
		const relatedJsonUrl = convertToJsonApiUrl(relatedUrl);

		if (relatedJsonUrl === null) {
			logger.warn(`Failed to convert URL: ${relatedUrl}`);
			return null;
		}

		const relatedData = await fetchRenderNode(relatedJsonUrl);
		const platforms = relatedData.metadata?.platforms;
		return platforms
			? analyzeCompatibility(ref.title || "Unknown", relatedUrl, platforms)
			: null;
	} catch (error) {
		logger.error(`Failed to fetch related API ${identifier}:`, error);
		return null;
	}
};

const collectAnalyses = async (
	identifiers: string[],
	data: RenderNode,
	found: CompatibilityAnalysis[],
): Promise<CompatibilityAnalysis[]> => {
	const [identifier, ...rest] = identifiers;
	if (identifier === undefined || found.length >= MAX_RELATED) {
		return found;
	}
	const analysis = await analyzeRelatedApi(identifier, data);
	return collectAnalyses(
		rest,
		data,
		analysis === null ? found : [...found, analysis],
	);
};

const analyzeRelatedCompatibility = async (
	data: RenderNode,
): Promise<CompatibilityAnalysis[]> => {
	if (!data.topicSections || !data.references) {
		return [];
	}

	const identifiers = data.topicSections.flatMap((section) =>
		section.identifiers.slice(
			0,
			PROCESSING_LIMITS.MAX_PLATFORM_COMPATIBILITY_ITEMS,
		),
	);
	const analyses = await collectAnalyses(identifiers, data, []);
	return analyses;
};
