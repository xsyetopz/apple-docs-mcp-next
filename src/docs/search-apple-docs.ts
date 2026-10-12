/**
 * A search of developer.apple.com, sent the way its search page sends it, and its results as Markdown.
 */
import { APPLE_URLS } from "../core/constants.ts";
import { requireText } from "../core/errors.ts";
import { logger } from "../core/logger.ts";
import { type SearchType, searchStreams } from "./search-api.ts";
import { parseSearchResults } from "./search-parser.ts";

export interface DocsSearchQuery {
  query: string;
  type: SearchType;
}

export async function searchAppleDocs({
  query,
  type,
}: DocsSearchQuery): Promise<string> {
  requireText(query, "Search query");
  logger.info(`Searching Apple docs for: ${query}`);
  const streams = await searchStreams(query, type);
  return parseSearchResults(
    streams,
    query,
    `${APPLE_URLS.SEARCH}?q=${encodeURIComponent(query)}`,
    type,
  );
}
