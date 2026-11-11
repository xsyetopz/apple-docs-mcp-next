import { z } from "zod";

import { generateUrlCacheKey, technologiesCache } from "../core/cache.ts";
import { APPLE_URLS } from "../core/constants.ts";
import { httpClient } from "../core/http-client.ts";
import { logger } from "../core/logger.ts";
import type { TechnologiesPage } from "../types/captured/technologies.gen.ts";
import { docUrl } from "./doc-formatter.ts";
import { hasText } from "./has-text.ts";

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

export interface TechnologiesQuery {
	category?: string | undefined;
	language?: string | undefined;
	includeBeta: boolean;
	limit: number;
}

export const handleListTechnologies = async ({
	category,
	language,
	includeBeta,
	limit,
}: TechnologiesQuery): Promise<string> => {
	logger.info("Fetching technologies list...");

	const cacheKey = generateUrlCacheKey("technologies", {
		category,
		language,
		includeBeta,
		limit,
	});

	const cachedResult = technologiesCache.get(cacheKey);
	if (cachedResult !== undefined) {
		logger.debug("Technologies cache hit");
		return cachedResult;
	}

	const technologies = parseTechnologies(await fetchTechnologiesPage());

	const matching = applyTechnologyFilters(technologies, {
		category,
		language,
		includeBeta,
	});
	const shown = matching
		.map((group) => ({
			...group,
			technologies: group.technologies.slice(0, limit),
		}))
		.filter((group) => group.technologies.length > 0);

	const result = formatTechnologiesList(
		shown,
		category,
		countTechnologies(matching) - countTechnologies(shown),
		limit,
	);

	technologiesCache.set(cacheKey, result);

	return result;
};

/**
 * Each technology's name as Apple writes it, by the last segment of its documentation path ("pdfkit" → "PDFKit")
 */
export const technologyNames = async (): Promise<Map<string, string>> => {
	const data = await fetchTechnologiesPage();
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
};

const technologiesPage = z.custom<TechnologiesPage>(
	(value) => typeof value === "object" && value !== null,
);

const fetchTechnologiesPage = async (): Promise<TechnologiesPage> =>
	technologiesPage.parse(
		await httpClient.getJson(APPLE_URLS.TECHNOLOGIES_JSON),
	);

const betaReference = z.object({
	identifier: z.string(),
	beta: z.literal(true),
});

const isBetaReference = (
	reference: unknown,
): reference is z.infer<typeof betaReference> =>
	betaReference.safeParse(reference).success;

const parseTechnologies = (data: TechnologiesPage): TechnologyGroup[] => {
	const references: unknown[] = Object.values(data.references);
	const betaIdentifiers = new Set(
		references
			.filter((reference) => isBetaReference(reference))
			.map((reference) => reference.identifier),
	);

	return data.sections
		.filter((section) => section.kind === "technologies")
		.flatMap((section) => section.groups)
		.map((group) => ({
			name: group.name,
			technologies: group.technologies.map((tech) => ({
				title: tech.title,
				identifier: tech.destination.identifier,
				tags: tech.tags,
				languages: tech.languages,
				beta: betaIdentifiers.has(tech.destination.identifier),
				url: docUrl(tech.destination.identifier),
			})),
		}));
};

const applyTechnologyFilters = (
	groups: TechnologyGroup[],
	filters: {
		category?: string | undefined;
		language?: string | undefined;
		includeBeta?: boolean | undefined;
	},
): TechnologyGroup[] => {
	const category = filters.category?.toLowerCase() ?? "";
	return groups
		.map((group) => {
			// A category is Apple's group or one of the tags it gives a technology ("Machine Learning")
			const wholeGroup = group.name.toLowerCase().includes(category);
			const filteredTechnologies = group.technologies.filter(
				(tech) =>
					(wholeGroup ||
						tech.tags.some((tag) => tag.toLowerCase().includes(category))) &&
					(filters.includeBeta === true || !tech.beta) &&
					(!hasText(filters.language) ||
						tech.languages.includes(filters.language)),
			);
			return {
				...group,
				technologies: filteredTechnologies,
			};
		})
		.filter((group) => group.technologies.length > 0);
};

/**
 * The framework ID, the last segment of the technology's link, which search_framework_symbols takes
 */
const frameworkId = (tech: Technology): string =>
	tech.identifier.split("/").pop() ?? "";

/**
 * A technology on a compact line: its name and, when it differs from the ID, the ID in parentheses; (beta) marks it
 */
const formatTechnology = (tech: Technology, withTags: boolean): string => {
	const id = frameworkId(tech);
	const name = tech.title === id ? id : `${tech.title} (${id})`;
	const beta = tech.beta ? " (beta)" : "";
	// Most technologies support Swift and Objective-C; the unfiltered view marks only the others
	const bothLanguages =
		tech.languages.includes("swift") && tech.languages.includes("occ");
	const languages =
		withTags || !bothLanguages ? ` [${tech.languages.join(", ")}]` : "";
	const tags =
		withTags && tech.tags.length > 0 ? `: ${tech.tags.join(", ")}` : "";
	return `${name}${beta}${languages}${tags}`;
};

const countTechnologies = (groups: TechnologyGroup[]): number =>
	groups.reduce((sum, group) => sum + group.technologies.length, 0);

const formatTechnologiesList = (
	groups: TechnologyGroup[],
	category: string | undefined,
	hidden: number,
	limit: number,
): string => {
	if (groups.length === 0) {
		return "No technologies found matching the specified criteria.";
	}

	const totalTechs = countTechnologies(groups);
	const betaTechs = groups.reduce(
		(sum, group) => sum + group.technologies.filter((tech) => tech.beta).length,
		0,
	);

	let content = `# Apple Developer Technologies\n${totalTechs} technologies`;
	if (betaTechs > 0) {
		content += ` (${betaTechs} in beta)`;
	}
	const withTags = hasText(category);
	content += withTags
		? ". Name (framework ID) for search_framework_symbols; tags follow the colon.\n"
		: ". Name (framework ID) for search_framework_symbols; [languages] only when not both swift and occ; pass category for each technology's languages and tags.\n";

	for (const group of groups) {
		content += `\n## ${group.name}\n`;

		if (withTags) {
			for (const tech of group.technologies) {
				content += `- ${formatTechnology(tech, true)}\n`;
			}
		} else {
			content += `${group.technologies.map((tech) => formatTechnology(tech, false)).join("; ")}\n`;
		}
	}

	if (hidden > 0) {
		content += `\nShowing the first ${limit} of each category; ${hidden} more not shown. Narrow with category or language, or raise limit.\n`;
	}

	return content.trimEnd();
};
