import type { Result } from "../types/captured/search-document.ts";
import type { SearchType } from "./search-api.ts";

/**
 * Search result parsing utilities
 */

export interface SearchResult {
  title: string;
  url: string;
  type: string;
  description: string;
  framework?: string | undefined;
  beta?: boolean | undefined;
  /** A WWDC session's year and number in the bundled WWDC data, which `get_wwdc_video` reads */
  wwdc?: { year: string; videoId: string };
}

/**
 * Type mapping for search filters
 */
const typeMapping: Record<SearchType, string[]> = {
  all: [
    "documentation",
    "documentation-article",
    "documentation-tutorial",
    "sample-code",
    "design-guideline",
    "wwdc-session",
    "help",
  ],
  documentation: ["documentation", "documentation-article"],
  design: ["design-guideline"],
  sample: ["sample-code"],
  help: ["help"],
};

/**
 * Where the Human Interface Guidelines live on developer.apple.com
 */
const DESIGN_GUIDELINES_PATH = "/design/human-interface-guidelines/";

/**
 * Where App Store Connect Help lives: web pages, which Apple's search reports by `sourceURL`
 */
export const HELP_PATH = "/help/app-store-connect/";

/**
 * Unsupported document types
 */
const UNSUPPORTED_TYPES = ["general", "video", "forums", "news"];

/**
 * Check if result type is supported
 */
const isResultTypeSupported = (
  resultType: string,
  filterType: SearchType,
): boolean => {
  // Apply type filter
  const allowedTypes = typeMapping[filterType];
  if (!allowedTypes.includes(resultType)) {
    return false;
  }

  // Exclude known unsupported types
  if (UNSUPPORTED_TYPES.includes(resultType)) {
    return false;
  }

  return true;
};

/**
 * Check if URL is supported
 */
const isUrlSupported = (url: string): boolean => {
  if (!url) {
    return false;
  }

  // Skip everything but the documentation, the design guidelines and App Store Connect Help
  if (
    !url.includes("/documentation/") &&
    !url.includes(DESIGN_GUIDELINES_PATH) &&
    !url.includes(HELP_PATH)
  ) {
    return false;
  }

  // Skip download links and zip files
  if (url.includes("download.apple.com") || url.includes(".zip")) {
    return false;
  }

  return true;
};

/**
 * A result as Apple's search API streams it
 */
/** One result of Apple's search API, typed by quicktype from captured responses (`npm run types:search`) */
export type ApiSearchResult = Result;

/**
 * Result types by the API's `kind`; every other kind (a symbol, an overview) is API reference
 */
const KIND_TYPES: Record<string, string> = {
  article: "documentation-article",
  tutorial: "documentation-tutorial",
  sampleCode: "sample-code",
};

/**
 * Parse a single search result
 */
export const parseSearchResult = (
  result: ApiSearchResult,
  filterType: SearchType,
): SearchResult | null => {
  const metadata = result.value?.metadata ?? {};
  if (metadata.itemTypes?.includes("Video")) {
    return parseWWDCSession(metadata, filterType);
  }
  if (metadata.sourceURL?.includes(HELP_PATH)) {
    return parseHelpPage(metadata, filterType);
  }
  return parseDocumentationPage(metadata, filterType);
};

/**
 * A documentation, guideline or sample-code page
 */
const parseDocumentationPage = (
  metadata: NonNullable<NonNullable<ApiSearchResult["value"]>["metadata"]>,
  filterType: SearchType,
): SearchResult | null => {
  const { title, permalink, kind, description, hierarchy } = metadata;
  // A guideline page reports itself as an article, so its place on the site is what tells it apart
  const type = permalink?.includes(DESIGN_GUIDELINES_PATH)
    ? "design-guideline"
    : (KIND_TYPES[kind ?? ""] ?? "documentation");

  if (
    !title ||
    !permalink ||
    !isResultTypeSupported(type, filterType) ||
    !isUrlSupported(permalink)
  ) {
    return null;
  }

  return {
    title,
    url: permalink,
    type,
    description: description ?? "",
    framework: hierarchy?.split(" > ")[0],
  };
};

/**
 * An App Store Connect Help page, whose title carries its place: "Platform version information - App information -
 * Reference - App Store Connect - Help"
 */
const parseHelpPage = (
  metadata: NonNullable<NonNullable<ApiSearchResult["value"]>["metadata"]>,
  filterType: SearchType,
): SearchResult | null => {
  const [title, section] = (metadata.title ?? "").split(" - ");
  if (
    !title ||
    !metadata.sourceURL ||
    !isResultTypeSupported("help", filterType)
  ) {
    return null;
  }
  return {
    title,
    url: metadata.sourceURL.replace(/\/$/, ""),
    type: "help",
    description: metadata.description ?? "",
    framework: section
      ? `App Store Connect Help › ${section}`
      : "App Store Connect Help",
  };
};

/**
 * A video result, kept when it is a WWDC session: those the bundled WWDC data holds, transcript and code
 */
const parseWWDCSession = (
  metadata: NonNullable<NonNullable<ApiSearchResult["value"]>["metadata"]>,
  filterType: SearchType,
): SearchResult | null => {
  const session = /^wwdc(\d{4})-(\d+)$/.exec(metadata.ids?.[0] ?? "");
  const year = session?.[1];
  const videoId = session?.[2];
  const title = metadata.titles?.[0];
  const url = metadata.permalinks?.[0];
  if (
    !year ||
    !videoId ||
    !title ||
    !url ||
    !isResultTypeSupported("wwdc-session", filterType)
  ) {
    return null;
  }
  return {
    title,
    url,
    type: "wwdc-session",
    description: metadata.descriptions?.[0] ?? "",
    wwdc: { year, videoId },
  };
};
