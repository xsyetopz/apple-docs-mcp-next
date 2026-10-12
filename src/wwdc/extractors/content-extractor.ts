/**
 * WWDC video content extractor
 */

import { JSDOM } from "jsdom";
import { WWDC_CONFIG, WWDC_URLS } from "../../core/constants.ts";
import { httpClient } from "../../core/http-client.ts";
import { logger } from "../../core/logger.ts";
import type {
  Chapter,
  CodeExample,
  RelatedVideo,
  TranscriptData,
  TranscriptSegment,
  VideoResources,
  WWDCVideo,
} from "../types.ts";

/** A videos page Apple answered with another page: it redirects retired URLs (a session's /code) to /videos/ */
class PageMovedError extends Error {}

/** A session's code section whose examples no longer hold code where the extractor reads it */
class CodeSectionChangedError extends Error {}

/**
 * A page of developer.apple.com/videos as a document; a redirect is an error, as the page it lands on is another one
 */
export async function fetchVideosPage(url: string): Promise<Document> {
  const response = await httpClient.get(url);
  if (response.redirected) {
    throw new PageMovedError(`${url} redirected to ${response.url}`);
  }
  return new JSDOM(await response.text()).window.document;
}

/**
 * Extract complete content for a single WWDC video, with its topics from Apple's topic pages
 */
export async function extractVideoContent(
  videoUrl: string,
  videoId: string,
  year: string,
  topics: string[],
): Promise<WWDCVideo> {
  try {
    logger.info("Extracting WWDC session", { year, videoId });

    const document = await fetchVideosPage(videoUrl);

    // Extract basic information
    const title = extractTitle(document);
    const speakers = extractSpeakers(document);
    const duration = extractDuration(document);

    const transcript = extractTranscript(document);
    const hasTranscript = transcript !== undefined;

    // Sessions before WWDC22 have no code section; their code sits in the transcript
    const sessionCode = extractCodeExamples(document, videoUrl);
    const codeExamples =
      sessionCode.length === 0 &&
      parseInt(year, 10) < WWDC_CONFIG.CODE_TAB_INTRODUCED_YEAR
        ? extractCodeFromTranscript(document)
        : sessionCode;
    const hasCode = codeExamples.length > 0;

    // Extract chapter information
    const chapters = extractChapters(document);

    const resources = extractResources(document);

    // Extract related videos
    const relatedVideos = await extractRelatedVideos(document, videoUrl);

    const video: WWDCVideo = {
      id: videoId,
      year,
      url: videoUrl,
      title,
      speakers,
      duration,
      topics,
      hasTranscript,
      hasCode,
      transcript: hasTranscript ? transcript : undefined,
      codeExamples: hasCode ? codeExamples : undefined,
      chapters: chapters.length > 0 ? chapters : undefined,
      resources,
      relatedVideos: relatedVideos.length > 0 ? relatedVideos : undefined,
      extractedAt: new Date().toISOString(),
    };

    return video;
  } catch (error) {
    logger.error(`Failed to extract video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Extract title
 */
function extractTitle(document: Document): string {
  // Try multiple selectors
  const selectors = [
    "h1.video-title",
    'h1[itemprop="name"]',
    ".hero-title",
    "h1",
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent) {
      return element.textContent.trim();
    }
  }

  return "Untitled Video";
}

/**
 * Extract speakers
 */
function extractSpeakers(document: Document): string[] {
  const speakers: string[] = [];

  // Try to extract from description
  const description = document.querySelector(
    ".video-description, .description",
  );
  if (description) {
    const text = description.textContent || "";
    // Match "with [Speaker]" or "by [Speaker]" patterns
    const speakerMatch = text.match(/(?:with|by)\s+([^.]+?)(?:\.|$)/i);
    if (speakerMatch) {
      const speakerText = speakerMatch[1] ?? "";
      // Split multiple speakers
      speakers.push(
        ...speakerText
          .split(/,\s*and\s*|,\s*|\s+and\s+/)
          .map((s: string) => s.trim()),
      );
    }
  }

  return speakers.filter((s) => s.length > 0);
}

/**
 * Extract duration
 */
function extractDuration(document: Document): string {
  const selectors = [".video-duration", '[itemprop="duration"]', ".duration"];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element?.textContent) {
      return element.textContent.trim();
    }
  }

  return "";
}

/**
 * The transcript on the session page, if it has one; a community or Q&A video's page has an empty transcript section
 */
function extractTranscript(document: Document): TranscriptData | undefined {
  const transcriptContainer = document.querySelector(
    '.transcript, [data-supplement="transcript"], #transcript',
  );
  const transcript = transcriptContainer
    ? extractTranscriptFromDocument(document)
    : undefined;
  return transcript?.fullText ? transcript : undefined;
}

/**
 * Extract transcript data from document
 */
function extractTranscriptFromDocument(document: Document): TranscriptData {
  const segments: TranscriptSegment[] = [];
  let fullText = "";

  // Find all transcript paragraphs
  const paragraphs = document.querySelectorAll(
    ".transcript p, .transcript-line, [data-timestamp]",
  );

  paragraphs.forEach((p: Element) => {
    const timestamp =
      p.getAttribute("data-timestamp") ||
      p.querySelector(".timestamp")?.textContent ||
      "";
    const text = p.textContent?.replace(/^\d+:\d+\s*/, "").trim() || "";

    if (text) {
      if (timestamp) {
        segments.push({ timestamp, text });
      }
      fullText += `${text}\n\n`;
    }
  });

  return {
    fullText: fullText.trim(),
    segments,
  };
}

/**
 * The code examples in the session page's code section: one container each, its "m:ss - Title" line before the code
 */
function extractCodeExamples(
  document: Document,
  videoUrl: string,
): CodeExample[] {
  const containers = document.querySelectorAll("li.sample-code-main-container");
  const codeBlocks = [
    ...document.querySelectorAll(
      "li.sample-code-main-container pre.code-source",
    ),
  ];
  if (codeBlocks.length !== containers.length) {
    throw new CodeSectionChangedError(
      `${videoUrl}: ${containers.length} code examples, ${codeBlocks.length} with code`,
    );
  }

  const examples = codeBlocks.map((block): CodeExample => {
    const code = cleanCodeIndentation(
      (block.querySelector("code") ?? block).textContent ?? "",
    );
    // Extract timestamp format like "11:02 - Speech Transcriber setup"
    const heading = block.previousElementSibling?.textContent?.trim() ?? "";
    const match = heading.match(/^(\d+:\d+)\s*-\s*(.+)$/);
    const headingTitle = match?.[2];
    return {
      timestamp: match?.[1] ?? "",
      title: headingTitle ? headingTitle.trim() : heading,
      language: detectLanguage(block),
      code,
    };
  });

  // Remove duplicates - sometimes same code block appears multiple times
  return removeDuplicateCodeExamples(
    examples.filter((example) => example.code.length >= 10),
  );
}

/**
 * Extract code from transcript (legacy pages)
 */
function extractCodeFromTranscript(document: Document): CodeExample[] {
  const examples: CodeExample[] = [];

  // Find code blocks in transcript
  const codeBlocks = document.querySelectorAll(
    ".transcript pre code, .transcript .code-voice",
  );

  codeBlocks.forEach((block: Element) => {
    let code = block.textContent || "";
    code = cleanCodeIndentation(code);
    if (code && code.length > 20) {
      // Filter out too short code snippets
      examples.push({
        language: detectLanguage(block),
        code,
      });
    }
  });

  return examples;
}

/**
 * Detect code language
 */
function detectLanguage(element: Element): string {
  // Detect from class attribute
  const className = element.className;
  if (className.includes("swift")) {
    return "swift";
  }
  if (className.includes("objc") || className.includes("objective-c")) {
    return "objc";
  }
  if (className.includes("javascript") || className.includes("js")) {
    return "javascript";
  }

  // Detect from data attributes
  const dataLang =
    element.getAttribute("data-language") || element.getAttribute("data-lang");
  if (dataLang) {
    return dataLang.toLowerCase();
  }

  // Default to Swift (most WWDC code is Swift)
  return "swift";
}

/**
 * Extract chapter information
 */
function extractChapters(document: Document): Chapter[] {
  const chapters: Chapter[] = [];

  const chapterElements = document.querySelectorAll(
    ".chapter, .timeline-chapter, [data-chapter]",
  );

  chapterElements.forEach((element: Element) => {
    const title =
      element.querySelector(".chapter-title")?.textContent ||
      element.textContent?.trim() ||
      "";
    const timestamp =
      element.getAttribute("data-timestamp") ||
      element.querySelector(".timestamp")?.textContent ||
      "";

    if (title && timestamp) {
      chapters.push({ title, timestamp });
    }
  });

  return chapters;
}

/**
 * The session page's Resources list: its documentation links and downloads
 */
function extractResources(document: Document): VideoResources {
  const resourceList = document.querySelector("li.supplement.details ul.links");
  if (resourceList) {
    return extractResourcesFromDocument(resourceList);
  }

  const resources: VideoResources = {
    resourceLinks: [],
  };

  // Fallback: at least try to extract video download links
  const downloadLinks = document.querySelectorAll(
    'a[href*=".mp4"], a[download]',
  );
  downloadLinks.forEach((link: Element) => {
    const href = link.getAttribute("href") || "";
    const text = link.textContent?.toLowerCase() || "";

    if (href.includes("_hd.mp4") || text.includes("hd")) {
      resources.hdVideo = href.startsWith("http")
        ? href
        : `${WWDC_URLS.BASE.replace("/videos", "")}${href}`;
    } else if (href.includes("_sd.mp4") || text.includes("sd")) {
      resources.sdVideo = href.startsWith("http")
        ? href
        : `${WWDC_URLS.BASE.replace("/videos", "")}${href}`;
    }
  });

  return resources;
}

/**
 * Extract resources from a page or one part of it
 */
function extractResourcesFromDocument(root: ParentNode): VideoResources {
  const links: NonNullable<VideoResources["resourceLinks"]> = [];
  const resources: VideoResources = {
    resourceLinks: links,
  };

  // Extract all resource links
  const resourceLinks = root.querySelectorAll("a[href]");
  const processedUrls = new Set<string>();

  resourceLinks.forEach((link: Element) => {
    const href = link.getAttribute("href") || "";
    const text = link.textContent?.trim() || "";

    if (!href || !text) {
      return;
    }

    // Build complete URL
    const fullUrl = href.startsWith("http")
      ? href
      : `${WWDC_URLS.BASE.replace("/videos", "")}${href}`;

    // Avoid duplicates
    if (processedUrls.has(fullUrl)) {
      return;
    }
    processedUrls.add(fullUrl);

    // Identify different types of resources
    if (href.includes("_hd.mp4") || text.toLowerCase().includes("hd video")) {
      resources.hdVideo = fullUrl;
    } else if (
      href.includes("_sd.mp4") ||
      text.toLowerCase().includes("sd video")
    ) {
      resources.sdVideo = fullUrl;
    } else if (href.includes("sample-code") || href.endsWith(".zip")) {
      resources.sampleProject = fullUrl;
    } else if (
      href.includes("/documentation/") ||
      href.includes("/design/") ||
      href.includes("/technotes/") ||
      href.includes("/forums/") ||
      text.includes("Human Interface Guidelines") ||
      text.includes("Documentation") ||
      text.includes("Forum")
    ) {
      // Add to resource links list
      links.push({
        title: text,
        url: fullUrl,
      });
    }
  });

  return resources;
}

/**
 * Extract related videos
 */
async function extractRelatedVideos(
  document: Document,
  videoUrl: string,
): Promise<RelatedVideo[]> {
  const relatedVideos: RelatedVideo[] = [];

  try {
    // Find related videos section
    const relatedSection = document.querySelector(
      ".related-videos, [data-related], #related",
    );

    if (!relatedSection) {
      // Try to find related video links from page bottom
      const videoLinks = document.querySelectorAll(
        'a[href*="/videos/play/wwdc"]',
      );
      const currentVideoId = videoUrl.match(/\/(\d+)\/?$/)?.[1];

      videoLinks.forEach((link: Element) => {
        const href = link.getAttribute("href") || "";
        const match = href.match(/\/videos\/play\/wwdc(\d{4})\/(\d+)\/?/);

        if (match && match[2] !== currentVideoId) {
          // Both groups are required digits, so a match always has them
          const year = match[1] ?? "";
          const id = match[2] ?? "";
          const title = link.textContent?.trim() || "";

          // Filter out current video and already added videos
          if (title && !relatedVideos.find((v) => v.id === id)) {
            relatedVideos.push({
              id,
              year,
              title,
              url: href.startsWith("http")
                ? href
                : `${WWDC_URLS.BASE.replace("/videos", "")}${href}`,
            });
          }
        }
      });
    }
  } catch (error) {
    logger.warn("Failed to extract related videos:", error);
  }

  return relatedVideos;
}

/**
 * Clean up code indentation
 */
function cleanCodeIndentation(code: string): string {
  const lines = code.split("\n");

  // Remove empty lines at start and end
  while (lines.length > 0 && lines[0]?.trim() === "") {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === "") {
    lines.pop();
  }

  if (lines.length === 0) {
    return "";
  }

  // Find minimum indentation (excluding empty lines)
  const minIndent = lines
    .filter((line) => line.trim().length > 0)
    .reduce((min, line) => {
      const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
      return Math.min(min, indent);
    }, Infinity);

  // Remove common indentation
  if (minIndent > 0 && minIndent !== Infinity) {
    return lines
      .map((line) => line.substring(minIndent))
      .join("\n")
      .trim();
  }

  return lines.join("\n").trim();
}

/**
 * Remove duplicate code examples
 */
function removeDuplicateCodeExamples(examples: CodeExample[]): CodeExample[] {
  const seen = new Map<string, CodeExample>();

  for (const example of examples) {
    // Use code content as key
    const key = example.code.trim();

    // If haven't seen this code, or current one has better metadata (title or timestamp)
    const existing = seen.get(key);
    if (
      !existing ||
      (example.title && !existing.title) ||
      (example.timestamp && !existing.timestamp)
    ) {
      seen.set(key, example);
    }
  }

  return Array.from(seen.values());
}
