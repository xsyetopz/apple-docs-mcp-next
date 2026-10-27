/**
 * Shared text helpers of the WWDC tool results
 */
import type { WWDCVideo } from "./types.ts";

const CODE_SNIPPET_LINES = 12;
const TRANSCRIPT_SNIPPET_CHARS = 300;

/**
 * One list line for a session: title link, year when asked for, duration, markers, topics when given
 */
export const sessionLine = (
  video: Pick<
    WWDCVideo,
    "title" | "url" | "hasTranscript" | "hasCode" | "topics"
  > & { year: string; duration?: string | undefined },
  options: { showYear: boolean; showTopics: boolean; note?: string },
): string => {
  const parts: string[] = [];
  if (options.showYear) {
    parts.push(video.year);
  }
  if (video.duration) {
    parts.push(video.duration);
  }
  if (options.note) {
    parts.push(options.note);
  }
  const markers = [
    video.hasTranscript ? "transcript" : "",
    video.hasCode ? "code" : "",
  ].filter(Boolean);
  if (markers.length > 0) {
    parts.push(markers.join(", "));
  }
  if (options.showTopics && video.topics.length > 0) {
    parts.push(video.topics.join(", "));
  }
  const tail = parts.length > 0 ? ` · ${parts.join(" · ")}` : "";
  return `- [${video.title}](${video.url})${tail}`;
};

/**
 * The code without leading blank lines and without a first comment line that only repeats the title
 */
export const tidyCode = (code: string, title?: string): string => {
  const lines = code.split("\n");
  const dropBlank = () => {
    while (lines.length > 0 && (lines[0] ?? "").trim() === "") {
      lines.shift();
    }
  };
  dropBlank();
  const first = (lines[0] ?? "").trim();
  if (title && first.startsWith("//")) {
    const comment = first.replace(/^\/\/+\s*/, "").toLowerCase();
    if (comment === title.trim().toLowerCase()) {
      lines.shift();
      dropBlank();
    }
  }
  return lines.join("\n");
};

/**
 * The first lines of a snippet, ending with a `…` line when lines were cut
 */
export const capCodeLines = (
  code: string,
  maxLines = CODE_SNIPPET_LINES,
): string => {
  const lines = code.split("\n");
  if (lines.length <= maxLines) {
    return code;
  }
  return `${lines.slice(0, maxLines).join("\n")}\n…`;
};

/**
 * About 300 chars of the text around the first match of the query, with `…` where text was cut
 */
export const snippetAround = (
  text: string,
  queryLower: string,
  maxChars = TRANSCRIPT_SNIPPET_CHARS,
): string => {
  if (text.length <= maxChars) {
    return text;
  }
  const at = Math.max(0, text.toLowerCase().indexOf(queryLower));
  const start = Math.max(
    0,
    Math.min(
      at - Math.floor((maxChars - queryLower.length) / 2),
      text.length - maxChars,
    ),
  );
  const end = Math.min(text.length, start + maxChars);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
};
