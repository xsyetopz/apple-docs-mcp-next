import type { Chapter, TranscriptData, TranscriptSegment } from "../types.ts";
import { firstNonEmpty, firstText } from "./dom.ts";

/**
 * The session page's title
 */
export const extractTitle = (document: Document): string =>
	firstText(document, [
		"h1.video-title",
		'h1[itemprop="name"]',
		".hero-title",
		"h1",
	]) ?? "Untitled Video";

/**
 * The speakers named in "with ..." or "by ..." in the page's description
 */
export const extractSpeakers = (document: Document): string[] => {
	const text =
		document.querySelector(".video-description, .description")?.textContent ??
		"";
	const speakerText = /(?:with|by)\s+([^.]+?)(?:\.|$)/iu.exec(text)?.[1] ?? "";
	return speakerText
		.split(/,\s*and\s*|,\s*|\s+and\s+/u)
		.map((speaker) => speaker.trim())
		.filter((speaker) => speaker.length > 0);
};

/**
 * The session's duration as the page writes it
 */
export const extractDuration = (document: Document): string =>
	firstText(document, [
		".video-duration",
		'[itemprop="duration"]',
		".duration",
	]) ?? "";

const extractTranscriptFromDocument = (document: Document): TranscriptData => {
	const segments: TranscriptSegment[] = [];
	let fullText = "";

	for (const paragraph of document.querySelectorAll<HTMLElement>(
		".transcript p, .transcript-line, [data-timestamp]",
	)) {
		const timestamp = firstNonEmpty(
			paragraph.dataset["timestamp"],
			paragraph.querySelector(".timestamp")?.textContent,
		);
		const text = (paragraph.textContent ?? "")
			.replace(/^\d+:\d+\s*/u, "")
			.trim();

		if (text !== "") {
			if (timestamp !== "") {
				segments.push({ timestamp, text });
			}
			fullText += `${text}\n\n`;
		}
	}

	return { fullText: fullText.trim(), segments };
};

/**
 * The transcript on the session page, if it has one; a community or Q&A video's page has an empty transcript section
 */
export const extractTranscript = (
	document: Document,
): TranscriptData | undefined => {
	if (
		!document.querySelector(
			'.transcript, [data-supplement="transcript"], #transcript',
		)
	) {
		return undefined;
	}
	const transcript = extractTranscriptFromDocument(document);
	return transcript.fullText === "" ? undefined : transcript;
};

/**
 * The session's chapters, each with a title and a timestamp
 */
export const extractChapters = (document: Document): Chapter[] => {
	const chapters: Chapter[] = [];

	for (const element of document.querySelectorAll<HTMLElement>(
		".chapter, .timeline-chapter, [data-chapter]",
	)) {
		const title = firstNonEmpty(
			element.querySelector(".chapter-title")?.textContent,
			element.textContent?.trim(),
		);
		const timestamp = firstNonEmpty(
			element.dataset["timestamp"],
			element.querySelector(".timestamp")?.textContent,
		);

		if (title !== "" && timestamp !== "") {
			chapters.push({ title, timestamp });
		}
	}

	return chapters;
};
