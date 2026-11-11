/**
 * WWDC video list extractor
 */

import { JSDOM } from "jsdom";

import { WWDC_URLS } from "../../core/constants.ts";
import { httpClient } from "../../core/http-client.ts";
import { logger } from "../../core/logger.ts";
import type { VideoListItem } from "../types.ts";
import { absoluteUrl, firstNonEmpty, firstText } from "./dom.ts";

const VIDEO_PATH = /\/videos\/play\/wwdc\d+\/(\d+)\/?/u;
const CARD = ".video-card, .collection-item, article";

const extractTitle = (element: Element): string => {
	const title = firstText(element, [
		".video-title",
		".item-title",
		"h2",
		"h3",
		"h4",
		'[itemprop="name"]',
	]);
	if (title !== undefined) {
		return title;
	}

	const alt = element.querySelector("img[alt]")?.getAttribute("alt") ?? "";
	if (alt !== "" && !alt.toLowerCase().includes("thumbnail")) {
		return alt.trim();
	}

	return "Untitled";
};

const extractTitleFromLink = (link: Element): string => {
	const linkText = link.textContent?.trim();
	if (linkText !== undefined && linkText.length > 3) {
		return linkText;
	}

	const parent = link.parentElement;
	if (parent) {
		return extractTitle(parent);
	}

	const sibling = firstNonEmpty(link.nextElementSibling?.textContent);
	return sibling === "" ? "Untitled" : sibling.trim();
};

const extractDuration = (element: Element): string => {
	for (const selector of [
		".video-duration",
		".duration",
		".time",
		'[itemprop="duration"]',
	]) {
		const duration = firstNonEmpty(
			element.querySelector(selector)?.textContent,
		).trim();
		if (/\d+:\d+/u.test(duration)) {
			return duration;
		}
	}

	return "";
};

const extractThumbnail = (element: Element): string => {
	const src = firstNonEmpty(
		element
			.querySelector(
				'img[src*="devimages"], img.thumbnail, img.video-thumbnail',
			)
			?.getAttribute("src"),
	);
	return src === "" ? "" : absoluteUrl(src);
};

const extractVideoFromElement = (
	element: HTMLElement,
	year: string,
): VideoListItem | null => {
	const link = element.querySelector('a[href*="/videos/play/"]') ?? element;
	const id = firstNonEmpty(
		element.dataset["videoId"],
		VIDEO_PATH.exec(link.getAttribute("href") ?? "")?.[1],
	);

	if (id === "") {
		return null;
	}

	return {
		id,
		url: WWDC_URLS.getVideoUrl(year, id),
		title: extractTitle(element),
		duration: extractDuration(element),
		thumbnail: extractThumbnail(element),
	};
};

const videoFromLink = (
	link: Element,
	year: string,
	id: string,
): VideoListItem => {
	const card = link.closest(CARD);
	return {
		id,
		url: WWDC_URLS.getVideoUrl(year, id),
		title: extractTitleFromLink(link),
		duration: card ? extractDuration(card) : "",
		thumbnail: card ? extractThumbnail(card) : "",
	};
};

const collectVideos = (
	document: Document,
	year: string,
): Map<string, VideoListItem> => {
	const uniqueVideos = new Map<string, VideoListItem>();

	for (const element of document.querySelectorAll<HTMLElement>(
		`.video-card, .collection-item, article[data-video-id], a[href*="/videos/play/"]`,
	)) {
		const video = extractVideoFromElement(element, year);
		if (video && !uniqueVideos.has(video.id)) {
			uniqueVideos.set(video.id, video);
		}
	}

	if (uniqueVideos.size === 0) {
		logger.warn(
			"No videos found with primary selectors, trying alternative method",
		);

		for (const link of document.querySelectorAll(
			`a[href*="/videos/play/wwdc${year}/"]`,
		)) {
			const id = VIDEO_PATH.exec(link.getAttribute("href") ?? "")?.[1];
			if (id !== undefined && !uniqueVideos.has(id)) {
				uniqueVideos.set(id, videoFromLink(link, year, id));
			}
		}
	}

	return uniqueVideos;
};

/**
 * Extract all WWDC video list for specified year
 */
export const extractVideoList = async (
	year: string,
): Promise<VideoListItem[]> => {
	const url = WWDC_URLS.getYearUrl(year);
	logger.info(`Extracting video list for WWDC${year} from ${url}`);

	try {
		const response = await httpClient.get(url);
		const { document } = new JSDOM(await response.text()).window;
		const videos = [...collectVideos(document, year).values()];
		logger.info(`Found ${videos.length} videos for WWDC${year}`);
		return videos;
	} catch (error) {
		logger.error(`Failed to extract video list for WWDC${year}:`, error);
		throw new Error(
			`Failed to extract video list for WWDC${year}: ${error instanceof Error ? error.message : String(error)}`,
			{ cause: error },
		);
	}
};
