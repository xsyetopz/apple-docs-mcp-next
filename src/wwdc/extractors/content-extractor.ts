/**
 * WWDC video content extractor
 */

import { JSDOM } from "jsdom";

import { WWDC_CONFIG } from "../../core/constants.ts";
import { httpClient } from "../../core/http-client.ts";
import { logger } from "../../core/logger.ts";
import type { CodeExample, WWDCVideo } from "../types.ts";
import {
	extractCodeExamples,
	extractCodeFromTranscript,
} from "./code-examples.ts";
import {
	extractChapters,
	extractDuration,
	extractSpeakers,
	extractTitle,
	extractTranscript,
} from "./page-fields.ts";
import { extractRelatedVideos, extractResources } from "./resources.ts";

/** A videos page Apple answered with another page: it redirects retired URLs (a session's /code) to /videos/ */
class PageMovedError extends Error {}

/**
 * A page of developer.apple.com/videos as a document; a redirect is an error, as the page it lands on is another one
 */
export const fetchVideosPage = async (url: string): Promise<Document> => {
	const response = await httpClient.get(url);
	if (response.redirected) {
		throw new PageMovedError(`${url} redirected to ${response.url}`);
	}
	return new JSDOM(await response.text()).window.document;
};

const extractCode = (
	document: Document,
	videoUrl: string,
	year: string,
): CodeExample[] => {
	const sessionCode = extractCodeExamples(document, videoUrl);
	return sessionCode.length === 0 &&
		Math.trunc(Number(year)) < WWDC_CONFIG.CODE_TAB_INTRODUCED_YEAR
		? extractCodeFromTranscript(document)
		: sessionCode;
};

/**
 * Extract complete content for a single WWDC video, with its topics from Apple's topic pages
 */
export const extractVideoContent = async (
	videoUrl: string,
	videoId: string,
	year: string,
	topics: string[],
): Promise<WWDCVideo> => {
	try {
		logger.info("Extracting WWDC session", { year, videoId });

		const document = await fetchVideosPage(videoUrl);
		const transcript = extractTranscript(document);
		const codeExamples = extractCode(document, videoUrl, year);
		const chapters = extractChapters(document);
		const relatedVideos = extractRelatedVideos(document, videoUrl);

		return {
			id: videoId,
			year,
			url: videoUrl,
			title: extractTitle(document),
			speakers: extractSpeakers(document),
			duration: extractDuration(document),
			topics,
			hasTranscript: transcript !== undefined,
			hasCode: codeExamples.length > 0,
			transcript,
			codeExamples: codeExamples.length > 0 ? codeExamples : undefined,
			chapters: chapters.length > 0 ? chapters : undefined,
			resources: extractResources(document),
			relatedVideos: relatedVideos.length > 0 ? relatedVideos : undefined,
			extractedAt: new Date().toISOString(),
		};
	} catch (error) {
		logger.error(`Failed to extract video ${videoId}:`, error);
		throw error;
	}
};
