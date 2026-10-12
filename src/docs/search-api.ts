/**
 * The requests search_apple_docs sends to Apple's search API, the one developer.apple.com/search calls: the search page
 * fills itself in the browser from this API, so its HTML holds no results
 * (https://github.com/kimsungwhee/apple-docs-mcp/issues/51).
 */
import Bottleneck from "bottleneck";

import { APPLE_URLS, RATE_LIMIT } from "../core/constants.ts";
import { httpClient } from "../core/http-client.ts";

/**
 * Searches one at a time, 15 s apart: Apple's search API answers quicker ones with no results (2026-10-06). Per server
 * process: two sessions searching at once each keep their own spacing.
 */
const searchLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: RATE_LIMIT.SEARCH_SPACING_MS,
});

const developerPath = (pathPrefix: string) => ({
  kind: "and",
  scopes: [
    { kind: "hostname", value: "developer.apple.com" },
    { kind: "pathPrefix", value: pathPrefix },
  ],
});

/**
 * Search scopes by `type`, built the way Apple's search page builds its filters
 * (developer.apple.com/search/scripts/search.js); `all` joins the documentation and the design guidelines
 */
export type SearchType = "all" | "documentation" | "design" | "sample" | "help";

const SEARCH_SCOPES: Record<SearchType, object> = {
  documentation: developerPath("/documentation/"),
  design: developerPath("/design/human-interface-guidelines/"),
  sample: { kind: "documentationRole", value: "sampleCode" },
  help: developerPath("/help/app-store-connect/"),
  all: {
    kind: "or",
    scopes: [
      developerPath("/documentation/"),
      developerPath("/design/human-interface-guidelines/"),
    ],
  },
};

/**
 * The videos, whose WWDC sessions the bundled WWDC data holds in full. `all` sends the search developer.apple.com/search
 * sends unfiltered, and asks for the videos on their own: mixed in, they came back in 0 to 7 of 20 results (2026-10-06).
 */
const VIDEOS_SCOPE = developerPath("/videos/play/");

/**
 * The response streams for one search, each read to its end: `all` sends two requests, every other type one
 */
export function searchStreams(
  query: string,
  type: SearchType,
): Promise<string[]> {
  const search = (
    includedResponses: string[],
    searchScope?: object,
  ): Promise<string> =>
    httpClient.postText(
      APPLE_URLS.SEARCH_API,
      {
        text: query,
        targetResultLocale: "en",
        includedResponses,
        ...(searchScope && { searchScope }),
      },
      "application/jsonl",
      { limiter: searchLimiter },
    );
  return Promise.all(
    type === "all"
      ? [search(["search"]), search(["search"], VIDEOS_SCOPE)]
      : [search(["search"], SEARCH_SCOPES[type])],
  );
}
