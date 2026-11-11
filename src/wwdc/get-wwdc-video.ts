/**
 * One WWDC session from the bundled data, as text
 */
import { loadVideoData } from "./data-source.ts";
import { tidyCode } from "./format.ts";
import { hasText } from "./has-text.ts";
import type { CodeExample, WWDCVideo } from "./types.ts";

export interface VideoQuery {
	year: string;
	videoId: string;
	includeTranscript: boolean;
	includeCode: boolean;
}

const formatHeader = (video: WWDCVideo): string => {
	const facts = [`WWDC${video.year}`];
	if (hasText(video.duration)) {
		facts.push(video.duration);
	}
	if (video.speakers && video.speakers.length > 0) {
		facts.push(video.speakers.join(", "));
	}
	let content = `# ${video.title}\n\n${facts.join(" · ")}\n[Watch](${video.url})`;
	if (hasText(video.resources.hdVideo)) {
		content += ` · [HD video](${video.resources.hdVideo})`;
	}
	content += "\n";
	if (video.topics.length > 0) {
		content += `Topics: ${video.topics.join(", ")}\n`;
	}
	for (const link of video.resources.resourceLinks ?? []) {
		content += `- [${link.title}](${link.url})\n`;
	}
	return content;
};

const formatChapters = (chapters: NonNullable<WWDCVideo["chapters"]>) =>
	`\n## Chapters\n\n${chapters.map((c) => `- ${c.timestamp} ${c.title}\n`).join("")}`;

const transcriptBody = (transcript: WWDCVideo["transcript"]): string => {
	if (transcript === undefined) {
		return "The bundled data has no transcript for this session.\n";
	}
	return transcript.segments.length > 0
		? transcript.segments.map((s) => `**${s.timestamp}** ${s.text}\n`).join("")
		: `${transcript.fullText}\n`;
};

const formatTranscript = (transcript: WWDCVideo["transcript"]): string =>
	`\n## Transcript\n\n${transcriptBody(transcript)}`;

const formatExample = (example: CodeExample, index: number): string => {
	let content = hasText(example.title)
		? `### ${example.title}`
		: `### Code Example ${index + 1}`;
	if (hasText(example.timestamp)) {
		content += ` (${example.timestamp})`;
	}
	content += `\n\`\`\`${example.language}\n${tidyCode(example.code, example.title)}\n\`\`\`\n`;
	if (hasText(example.context)) {
		content += `*${example.context}*\n`;
	}
	return content;
};

const formatRelated = (related: NonNullable<WWDCVideo["relatedVideos"]>) =>
	`\n## Related Videos\n\n${related.map((r) => `- [${r.title}](${r.url}) (WWDC${r.year})\n`).join("")}`;

const formatVideoDetail = (
	video: WWDCVideo,
	includeTranscript: boolean,
	includeCode: boolean,
): string => {
	let content = formatHeader(video);
	if (video.chapters && video.chapters.length > 0) {
		content += formatChapters(video.chapters);
	}
	if (includeTranscript) {
		content += formatTranscript(video.transcript);
	}
	if (includeCode && video.codeExamples && video.codeExamples.length > 0) {
		content += `\n## Code Examples\n\n${video.codeExamples.map(formatExample).join("")}`;
	}
	if (video.relatedVideos && video.relatedVideos.length > 0) {
		content += formatRelated(video.relatedVideos);
	}
	return content;
};

/**
 * Get WWDC video details
 */
export const handleGetWWDCVideo = async ({
	year,
	videoId,
	includeTranscript,
	includeCode,
}: VideoQuery): Promise<string> => {
	const video = await loadVideoData(year, videoId);

	return formatVideoDetail(video, includeTranscript, includeCode);
};
