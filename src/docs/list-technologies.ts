import { generateUrlCacheKey, technologiesCache } from "../core/cache.ts";
import { API_LIMITS, APPLE_URLS } from "../core/constants.ts";
import { httpClient } from "../core/http-client.ts";
import { logger } from "../core/logger.ts";
import type { TechnologiesPage } from "../types/captured/technologies.ts";
import { docUrl } from "./doc-formatter.ts";

/**
 * 技术信息接口
 */
interface Technology {
  title: string;
  identifier: string;
  tags: string[];
  languages: string[];
  beta: boolean;
  url?: string;
  destination?: {
    identifier: string;
  };
}

interface TechnologyGroup {
  name: string;
  technologies: Technology[];
}

/**
 * 获取技术列表
 */
export async function handleListTechnologies(
  category?: string,
  language?: string,
  includeBeta: boolean = true,
  limit: number = API_LIMITS.DEFAULT_TECHNOLOGIES_LIMIT,
): Promise<string> {
  try {
    logger.info("Fetching technologies list...");

    // Generate cache key
    const cacheKey = generateUrlCacheKey("technologies", {
      category,
      language,
      includeBeta,
      limit,
    });

    // Try to get from cache first
    const cachedResult = technologiesCache.get(cacheKey);
    if (cachedResult) {
      logger.debug("Technologies cache hit");
      return cachedResult;
    }

    // 获取技术列表
    const data = await httpClient.getJson<TechnologiesPage>(
      APPLE_URLS.TECHNOLOGIES_JSON,
    );

    // 解析技术列表
    const technologies = parseTechnologies(data);

    // 应用过滤器
    const filteredTechnologies = applyTechnologyFilters(technologies, {
      category,
      language,
      includeBeta,
      limit,
    });

    // 格式化输出
    const result = formatTechnologiesList(filteredTechnologies);

    // Cache the result
    technologiesCache.set(cacheKey, result);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: Failed to list technologies: ${errorMessage}`;
  }
}

/**
 * Each technology's name as Apple writes it, by the last segment of its documentation path ("pdfkit" → "PDFKit")
 */
export async function technologyNames(): Promise<Map<string, string>> {
  const data = await httpClient.getJson<TechnologiesPage>(
    APPLE_URLS.TECHNOLOGIES_JSON,
  );
  return new Map(
    data.sections
      .filter((section) => section.kind === "technologies")
      .flatMap((section) => section.groups)
      .flatMap((group) => group.technologies)
      .map((tech) => [
        tech.destination.identifier.split("/").pop()?.toLowerCase() ?? "",
        tech.title,
      ]),
  );
}

/**
 * 解析技术数据
 */
function parseTechnologies(data: TechnologiesPage): TechnologyGroup[] {
  const groups: TechnologyGroup[] = [];
  // Apple marks a beta technology on its reference, as Swift-DocC marks any beta page
  const betaIdentifiers = new Set(
    Object.values(data.references)
      .filter((reference) => "beta" in reference && reference.beta === true)
      .map((reference) => reference.identifier),
  );

  if (data.sections) {
    data.sections.forEach((section) => {
      if (section.kind === "technologies" && section.groups) {
        section.groups.forEach((group) => {
          if (group.technologies && Array.isArray(group.technologies)) {
            const technologies: Technology[] = group.technologies.map(
              (tech) => ({
                title: tech.title || "",
                identifier: tech.destination.identifier,
                tags: tech.tags || [],
                languages: tech.languages || [],
                beta: betaIdentifiers.has(tech.destination.identifier),
                url: docUrl(tech.destination.identifier),
              }),
            );

            groups.push({
              name: group.name,
              technologies,
            });
          }
        });
      }
    });
  }

  return groups;
}

/**
 * 应用过滤器
 */
function applyTechnologyFilters(
  groups: TechnologyGroup[],
  filters: {
    category?: string | undefined;
    language?: string | undefined;
    includeBeta?: boolean | undefined;
    limit?: number | undefined;
  },
): TechnologyGroup[] {
  const category = filters.category?.toLowerCase() ?? "";
  return groups
    .map((group) => {
      // A category is Apple's group or one of the tags it gives a technology ("Machine Learning")
      const wholeGroup = group.name.toLowerCase().includes(category);
      const filteredTechnologies = group.technologies.filter(
        (tech) =>
          (wholeGroup ||
            tech.tags.some((tag) => tag.toLowerCase().includes(category))) &&
          (filters.includeBeta || !tech.beta) &&
          (!filters.language || tech.languages.includes(filters.language)),
      );
      return {
        ...group,
        technologies: filteredTechnologies.slice(0, filters.limit),
      };
    })
    .filter((group) => group.technologies.length > 0);
}

/**
 * 格式化技术列表
 */
function formatTechnologiesList(groups: TechnologyGroup[]): string {
  if (groups.length === 0) {
    return "No technologies found matching the specified criteria.";
  }

  let content = "# Apple Developer Technologies\n\n";

  // 统计信息
  const totalTechs = groups.reduce(
    (sum, group) => sum + group.technologies.length,
    0,
  );
  const betaTechs = groups.reduce(
    (sum, group) => sum + group.technologies.filter((tech) => tech.beta).length,
    0,
  );

  content += `*Found ${totalTechs} technologies`;
  if (betaTechs > 0) {
    content += ` (${betaTechs} in beta)`;
  }
  content += "*\n\n";

  // 按分类显示
  groups.forEach((group) => {
    content += `## ${group.name}\n\n`;

    group.technologies.forEach((tech) => {
      // Create title with status information
      const titleWithStatus = tech.beta ? `${tech.title} (Beta)` : tech.title;

      content += `### [${titleWithStatus}](${tech.url || "#"})\n`;

      // Build metadata array
      const metadata = [];

      // Add languages
      if (tech.languages.length > 0) {
        metadata.push(`Languages: ${tech.languages.join(", ")}`);
      }

      if (tech.tags.length > 0) {
        metadata.push(`Categories: ${tech.tags.join(", ")}`);
      }

      // Add metadata line if any
      if (metadata.length > 0) {
        content += `*${metadata.join(" | ")}*\n`;
      }

      content += "\n";
    });
  });

  content +=
    "\n---\n\n[View all technologies on Apple Developer](https://developer.apple.com/documentation/technologies)";

  return content;
}
