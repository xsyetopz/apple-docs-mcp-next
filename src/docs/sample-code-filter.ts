import { hasText } from "./doc-formatter.ts";
import { normalizeFrameworkName } from "./framework-mapper.ts";
import type { ParsedSampleCode } from "./sample-code-parser.ts";

export interface SampleCodeFilters {
	framework?: string | undefined;
	beta?: "include" | "exclude" | "only" | undefined;
	searchQuery?: string | undefined;
}

const matchesFramework = (
	code: ParsedSampleCode,
	framework: string,
): boolean => {
	const wanted = normalizeFrameworkName(framework).toLowerCase();
	return (
		normalizeFrameworkName(code.framework ?? "")
			.toLowerCase()
			.includes(wanted) ||
		code.title.toLowerCase().includes(wanted) ||
		code.path.toLowerCase().includes(wanted)
	);
};

const matchesQuery = (code: ParsedSampleCode, query: string): boolean =>
	[code.title, code.framework ?? "", code.path, code.description ?? ""].some(
		(text) => text.toLowerCase().includes(query),
	);

/**
 * Applies filters to sample codes
 */
export const applySampleCodeFilters = (
	sampleCodes: ParsedSampleCode[],
	filters: SampleCodeFilters,
): ParsedSampleCode[] => {
	const { framework, beta, searchQuery } = filters;
	const query = searchQuery?.toLowerCase();
	return sampleCodes.filter(
		(code) =>
			(!hasText(framework) || matchesFramework(code, framework)) &&
			!(beta === "exclude" && code.beta) &&
			!(beta === "only" && !code.beta) &&
			(!hasText(query) || matchesQuery(code, query)),
	);
};
