import { PROCESSING_LIMITS } from "../core/constants.ts";
import { httpClient } from "../core/http-client.ts";
import { logger } from "../core/logger.ts";
import type { PlatformAvailability, RenderNode } from "../types/docc.ts";
import { isDeprecated, isTopicReference } from "../types/docc.ts";
import { convertToJsonApiUrl } from "./url-converter.ts";

interface CompatibilityAnalysis {
  apiName: string;
  apiUrl: string;
  platforms: PlatformAvailability[];
  supportedPlatforms: string[];
  betaPlatforms: string[];
  deprecatedPlatforms: string[];
  minVersions: Record<string, string>;
  crossPlatformSupport: boolean;
}

export interface PlatformCompatibilityQuery {
  apiUrl: string;
  compareMode: "single" | "framework";
  includeRelated: boolean;
}

export const handleGetPlatformCompatibility = async ({
  apiUrl,
  compareMode,
  includeRelated,
}: PlatformCompatibilityQuery): Promise<string> => {
  logger.info(`Analyzing platform compatibility for: ${apiUrl}`);

  if (compareMode === "framework") {
    return await analyzeFrameworkCompatibility(apiUrl, includeRelated);
  } else {
    return await analyzeSingleApiCompatibility(apiUrl, includeRelated);
  }
};

const analyzeSingleApiCompatibility = async (
  apiUrl: string,
  includeRelated: boolean,
): Promise<string> => {
  const jsonApiUrl = convertToJsonApiUrl(apiUrl);

  if (!jsonApiUrl) {
    throw new Error("Invalid Apple Developer Documentation URL");
  }

  const data = await httpClient.getJson<RenderNode>(jsonApiUrl);

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
    const relatedAnalyses = await analyzeRelatedCompatibility(data, 3);
    if (relatedAnalyses.length > 0) {
      result += "\n\n## Related APIs Compatibility\n\n";
      for (const relatedAnalysis of relatedAnalyses) {
        result += `${formatCompatibilityAnalysis(relatedAnalysis, true)}\n`;
      }
    }
  }

  return result;
};

const analyzeFrameworkCompatibility = async (
  frameworkUrl: string,
  includeRelated: boolean,
): Promise<string> => {
  // Could extend this to analyze the whole framework
  // For now it uses single-API analysis as the base.
  return await analyzeSingleApiCompatibility(
    frameworkUrl,
    includeRelated || true,
  );
};

const analyzeRelatedCompatibility = async (
  data: RenderNode,
  maxRelated: number = 3,
): Promise<CompatibilityAnalysis[]> => {
  const analyses: CompatibilityAnalysis[] = [];

  if (!data.topicSections || !data.references) {
    return analyses;
  }

  let count = 0;
  for (const section of data.topicSections) {
    if (count >= maxRelated) {
      break;
    }

    for (const identifier of section.identifiers.slice(
      0,
      PROCESSING_LIMITS.MAX_PLATFORM_COMPATIBILITY_ITEMS,
    )) {
      if (count >= maxRelated) {
        break;
      }

      const ref = data.references[identifier];
      if (isTopicReference(ref)) {
        try {
          const relatedUrl = `https://developer.apple.com${ref.url}`;
          const relatedJsonUrl = convertToJsonApiUrl(relatedUrl);

          if (!relatedJsonUrl) {
            logger.warn(`Failed to convert URL: ${relatedUrl}`);
            continue;
          }

          const relatedData =
            await httpClient.getJson<RenderNode>(relatedJsonUrl);
          if (relatedData.metadata?.platforms) {
            const analysis = analyzeCompatibility(
              ref.title || "Unknown",
              relatedUrl,
              relatedData.metadata.platforms,
            );
            analyses.push(analysis);
            count++;
          }
        } catch (error) {
          logger.error(`Failed to fetch related API ${identifier}:`, error);
        }
      }
    }
  }

  return analyses;
};

const analyzeCompatibility = (
  apiName: string,
  apiUrl: string,
  platforms: PlatformAvailability[],
): CompatibilityAnalysis => {
  const supportedPlatforms: string[] = [];
  const betaPlatforms: string[] = [];
  const deprecatedPlatforms: string[] = [];
  const minVersions: Record<string, string> = {};

  for (const platform of platforms) {
    const name = platform.name;
    if (!name) {
      continue;
    }
    supportedPlatforms.push(name);

    if (platform.beta) {
      betaPlatforms.push(name);
    }

    if (isDeprecated(platform)) {
      deprecatedPlatforms.push(name);
    }

    if (platform.introducedAt) {
      minVersions[name] = platform.introducedAt;
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

const formatCompatibilityAnalysis = (
  analysis: CompatibilityAnalysis,
  isRelated: boolean = false,
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

  content += "\n";

  content += "## Detailed Platform Information\n\n";

  for (const platform of analysis.platforms) {
    content += `**${platform.name}**\n`;

    if (platform.introducedAt) {
      content += `- Introduced: ${platform.introducedAt}\n`;
    }

    if (platform.deprecatedAt) {
      content += `- Deprecated: ${platform.deprecatedAt}\n`;
    }

    const status = [];
    if (platform.beta) {
      status.push("Beta");
    }
    if (isDeprecated(platform)) {
      status.push("Deprecated");
    }
    if (platform.unavailable) {
      status.push("Unavailable");
    }

    if (status.length > 0) {
      content += `- Status: ${status.join(", ")}\n`;
    }

    if (platform.message) {
      content += `- Note: ${platform.message}\n`;
    }

    content += "\n";
  }

  content += "## Compatibility Recommendations\n\n";

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

  if (Object.keys(analysis.minVersions).length > 0) {
    content += "## Minimum Version Requirements\n\n";
    for (const [platform, version] of Object.entries(analysis.minVersions)) {
      content += `- **${platform}:** ${version}+\n`;
    }
    content += "\n";
  }

  return content;
};
