import type { RelatedVideo, VideoResources } from "../types.ts";
import { absoluteUrl } from "./dom.ts";

type ResourceLink = NonNullable<VideoResources["resourceLinks"]>[number];

const DOC_PATHS = ["/documentation/", "/design/", "/technotes/", "/forums/"];
const DOC_TEXTS = ["Human Interface Guidelines", "Documentation", "Forum"];

const addResource = (
	resources: VideoResources,
	links: ResourceLink[],
	href: string,
	text: string,
): void => {
	const url = absoluteUrl(href);
	const lowerText = text.toLowerCase();

	if (href.includes("_hd.mp4") || lowerText.includes("hd video")) {
		resources.hdVideo = url;
	} else if (href.includes("_sd.mp4") || lowerText.includes("sd video")) {
		resources.sdVideo = url;
	} else if (href.includes("sample-code") || href.endsWith(".zip")) {
		resources.sampleProject = url;
	} else if (
		DOC_PATHS.some((part) => href.includes(part)) ||
		DOC_TEXTS.some((part) => text.includes(part))
	) {
		links.push({ title: text, url });
	}
};

const extractResourcesFromList = (root: ParentNode): VideoResources => {
	const links: ResourceLink[] = [];
	const resources: VideoResources = { resourceLinks: links };
	const processedUrls = new Set<string>();

	for (const link of root.querySelectorAll("a[href]")) {
		const href = link.getAttribute("href") ?? "";
		const text = link.textContent?.trim() ?? "";
		const url = absoluteUrl(href);

		if (href !== "" && text !== "" && !processedUrls.has(url)) {
			processedUrls.add(url);
			addResource(resources, links, href, text);
		}
	}

	return resources;
};

/**
 * The session page's Resources list: its documentation links and downloads
 */
export const extractResources = (document: Document): VideoResources => {
	const resourceList = document.querySelector("li.supplement.details ul.links");
	if (resourceList) {
		return extractResourcesFromList(resourceList);
	}

	const resources: VideoResources = { resourceLinks: [] };

	for (const link of document.querySelectorAll(
		'a[href*=".mp4"], a[download]',
	)) {
		const href = link.getAttribute("href") ?? "";
		const text = link.textContent?.toLowerCase() ?? "";

		if (href.includes("_hd.mp4") || text.includes("hd")) {
			resources.hdVideo = absoluteUrl(href);
		} else if (href.includes("_sd.mp4") || text.includes("sd")) {
			resources.sdVideo = absoluteUrl(href);
		}
	}

	return resources;
};

/**
 * Links to other sessions at the page's bottom, when the page has no related-videos section
 */
export const extractRelatedVideos = (
	document: Document,
	videoUrl: string,
): RelatedVideo[] => {
	if (document.querySelector(".related-videos, [data-related], #related")) {
		return [];
	}

	const currentVideoId = /\/(\d+)\/?$/u.exec(videoUrl)?.[1];
	const relatedVideos = new Map<string, RelatedVideo>();

	for (const link of document.querySelectorAll(
		'a[href*="/videos/play/wwdc"]',
	)) {
		const href = link.getAttribute("href") ?? "";
		const [, year, id] =
			/\/videos\/play\/wwdc(\d{4})\/(\d+)\/?/u.exec(href) ?? [];
		const title = link.textContent?.trim() ?? "";

		if (
			year !== undefined &&
			id !== undefined &&
			id !== currentVideoId &&
			title !== "" &&
			!relatedVideos.has(id)
		) {
			relatedVideos.set(id, { id, year, title, url: absoluteUrl(href) });
		}
	}

	return [...relatedVideos.values()];
};
