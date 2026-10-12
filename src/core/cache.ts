/**
 * In-memory caches of Apple's answers, one per kind, each holding at most its size and expiring entries (lru-cache)
 */
import { LRUCache } from "lru-cache";

import { CACHE_SIZE, CACHE_TTL, WWDC_CONFIG } from "./constants.ts";

/** A page as `get_apple_doc_content` returns it */
export const apiCache = new LRUCache<
  string,
  { content: Array<{ type: "text"; text: string }> }
>({
  max: CACHE_SIZE.API_DOCS,
  ttl: CACHE_TTL.API_DOCS,
});
export const indexCache = new LRUCache<string, string>({
  max: CACHE_SIZE.FRAMEWORK_INDEX,
  ttl: CACHE_TTL.FRAMEWORK_INDEX,
});
export const technologiesCache = new LRUCache<string, string>({
  max: CACHE_SIZE.TECHNOLOGIES,
  ttl: CACHE_TTL.TECHNOLOGIES,
});
export const updatesCache = new LRUCache<string, string>({
  max: CACHE_SIZE.UPDATES,
  ttl: CACHE_TTL.UPDATES,
});
export const sampleCodeCache = new LRUCache<string, string>({
  max: CACHE_SIZE.SAMPLE_CODE,
  ttl: CACHE_TTL.SAMPLE_CODE,
});
export const technologyOverviewsCache = new LRUCache<string, string>({
  max: CACHE_SIZE.TECHNOLOGY_OVERVIEWS,
  ttl: CACHE_TTL.TECHNOLOGY_OVERVIEWS,
});
export const wwdcDataCache = new LRUCache<string, string>({
  max: 100,
  ttl: WWDC_CONFIG.CACHE_TTL,
});

/**
 * Generate cache key for URL-based requests
 */
export function generateUrlCacheKey(
  url: string,
  params?: Record<string, unknown>,
): string {
  let key = url;
  if (params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}=${JSON.stringify(params[k])}`)
      .join("&");
    key += `?${sortedParams}`;
  }
  return key;
}

/**
 * Generate cache key for enhanced analysis
 */
export function generateEnhancedCacheKey(
  url: string,
  options: {
    includeRelatedApis?: boolean;
    includeReferences?: boolean;
    includeSimilarApis?: boolean;
    includePlatformAnalysis?: boolean;
  },
): string {
  return generateUrlCacheKey(url, options);
}
