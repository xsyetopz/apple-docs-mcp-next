import { WWDC_URLS } from "../../core/constants.ts";

/**
 * An href as an absolute URL: relative ones resolve against developer.apple.com
 */
export const absoluteUrl = (href: string): string =>
	href.startsWith("http")
		? href
		: `${WWDC_URLS.BASE.replace("/videos", "")}${href}`;

/**
 * The first value that is neither missing nor empty, or an empty string
 */
export const firstNonEmpty = (
	...values: (string | null | undefined)[]
): string => {
	for (const value of values) {
		if (value !== null && value !== undefined && value !== "") {
			return value;
		}
	}
	return "";
};

/**
 * The trimmed text of the first selector whose element has text
 */
export const firstText = (
	root: ParentNode,
	selectors: string[],
): string | undefined => {
	for (const selector of selectors) {
		const content = firstNonEmpty(root.querySelector(selector)?.textContent);
		if (content !== "") {
			return content.trim();
		}
	}
	return undefined;
};
