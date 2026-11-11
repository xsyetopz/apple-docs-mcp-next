import { hasText } from "./doc-formatter.ts";
import type { ParsedSampleCode } from "./sample-code-parser.ts";

const WWDC_CATEGORY = /^WWDC(\d+)$/u;

const compareCategories = (a: string, b: string): number => {
	const aYear = WWDC_CATEGORY.exec(a)?.[1];
	const bYear = WWDC_CATEGORY.exec(b)?.[1];
	if (aYear !== undefined && bYear !== undefined) {
		return Number(bYear) - Number(aYear);
	}
	if (aYear !== undefined) {
		return -1;
	}
	return bYear === undefined ? a.localeCompare(b) : 1;
};

const formatSampleCodeItem = (code: ParsedSampleCode): string => {
	const badge = code.beta ? " (Beta)" : "";
	const description = hasText(code.description) ? `: ${code.description}` : "";
	return `- [${code.title}](${code.url})${badge}${description}`;
};

const formatSection = (title: string, codes: ParsedSampleCode[]): string[] => {
	const items = codes.filter((code) => code.featured !== true);
	return items.length > 0
		? [`## ${title}`, ...items.map((code) => formatSampleCodeItem(code)), ""]
		: [];
};

const groupByCategory = (
	sampleCodes: ParsedSampleCode[],
): Map<string, ParsedSampleCode[]> => {
	const byCategory = new Map<string, ParsedSampleCode[]>();
	for (const code of sampleCodes) {
		const category = hasText(code.framework) ? code.framework : "";
		const key = /^WWDC\d+$/iu.test(category)
			? category.toUpperCase()
			: category;
		byCategory.set(key, [...(byCategory.get(key) ?? []), code]);
	}
	return byCategory;
};

/**
 * Formats the sample code result
 */
export const formatSampleCodeResult = (
	sampleCodes: ParsedSampleCode[],
	options: { totalFound: number; showing: number },
): string => {
	const lines = [
		"# Apple Sample Code Library",
		`${options.totalFound} sample code projects`,
		"",
	];
	if (sampleCodes.length === 0) {
		lines.push("No sample code projects found matching your criteria.");
		return lines.join("\n");
	}

	const byCategory = groupByCategory(sampleCodes);
	const uncategorized = byCategory.get("") ?? [];
	byCategory.delete("");
	const featured = sampleCodes.filter((code) => code.featured === true);
	if (featured.length > 0) {
		lines.push(
			"## Featured",
			...featured.map((code) => formatSampleCodeItem(code)),
			"",
		);
	}
	for (const category of [...byCategory.keys()].toSorted(compareCategories)) {
		lines.push(...formatSection(category, byCategory.get(category) ?? []));
	}
	lines.push(...formatSection("Other", uncategorized));
	if (options.showing < options.totalFound) {
		lines.push(
			`Showing ${options.showing} of ${options.totalFound}. Narrow with searchQuery or framework, or raise limit.`,
		);
	}
	return lines.join("\n").trim();
};
