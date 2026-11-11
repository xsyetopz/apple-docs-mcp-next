/**
 * URL conversion utilities for Apple Developer Documentation
 */

import { APPLE_URLS } from "../core/constants.ts";

/**
 * A page's full URL: a site path, as page links give it ("/documentation/uikit/uiview"), is on developer.apple.com
 */
export const absoluteAppleUrl = (url: string): string =>
	url.startsWith("/") ? `${APPLE_URLS.BASE}${url}` : url;

/**
 * Convert a web URL to a JSON API URL
 * @param webUrl The web URL to convert
 * @returns The corresponding JSON API URL
 */
export const convertToJsonApiUrl = (webUrl: string): string | null => {
	try {
		const trimmed = webUrl.endsWith("/") ? webUrl.slice(0, -1) : webUrl;
		const urlObj = new URL(absoluteAppleUrl(trimmed));

		if (urlObj.hostname !== "developer.apple.com") {
			return null;
		}

		const path = urlObj.pathname;

		if (path.includes("/documentation/")) {
			return `https://developer.apple.com/tutorials/data/documentation/${path.replace("/documentation/", "")}.json`;
		}

		// The design guidelines are served from the same data path as the documentation, in any letter case:
		// Xcode's DocumentationSearch writes the path as /design/Human-Interface-Guidelines/…
		if (
			path.toLowerCase().startsWith("/design/human-interface-guidelines/") ||
			path.startsWith("/tutorials/")
		) {
			return `https://developer.apple.com/tutorials/data${path}.json`;
		}

		return trimmed;
	} catch {
		return null;
	}
};

/**
 * Validate if URL is from Apple Developer domain
 * @param url The URL to validate
 * @returns True if valid Apple Developer URL
 */
export const isValidAppleDeveloperUrl = (url: string): boolean => {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname === "developer.apple.com";
	} catch {
		return false;
	}
};
