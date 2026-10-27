/**
 * Configuration constants for Apple Docs MCP
 */

// API Limits
export const API_LIMITS = {
  MAX_SEARCH_RESULTS: 50,
  MAX_WWDC_RESULTS: 5,

  // Default values for various operations
  DEFAULT_FRAMEWORK_SYMBOLS_LIMIT: 30,
  DEFAULT_DOCUMENTATION_UPDATES_LIMIT: 20,
  DEFAULT_TECHNOLOGY_OVERVIEWS_LIMIT: 20,
  DEFAULT_SAMPLE_CODE_LIMIT: 20,
  DEFAULT_TECHNOLOGIES_LIMIT: 200,
  DEFAULT_REFERENCES_LIMIT: 20,

  // Maximum values for schema validation
  MAX_FRAMEWORK_SYMBOLS_LIMIT: 200,
  MAX_DOCUMENTATION_UPDATES_LIMIT: 200,
  MAX_TECHNOLOGY_OVERVIEWS_LIMIT: 200,
  MAX_SAMPLE_CODE_LIMIT: 200,
  MAX_TECHNOLOGIES_LIMIT: 500,
  MAX_REFERENCES_LIMIT: 50,
} as const;

// Search Depth Configuration
export const SEARCH_DEPTH_LIMITS = {
  shallow: 5,
  medium: 10,
  deep: 15,
} as const;

// Cache TTL Configuration (in milliseconds)
export const CACHE_TTL = {
  API_DOCS: 30 * 60 * 1000, // 30 minutes
  FRAMEWORK_INDEX: 60 * 60 * 1000, // 1 hour
  TECHNOLOGIES: 2 * 60 * 60 * 1000, // 2 hours
  UPDATES: 30 * 60 * 1000, // 30 minutes
  SAMPLE_CODE: 2 * 60 * 60 * 1000, // 2 hours
  TECHNOLOGY_OVERVIEWS: 2 * 60 * 60 * 1000, // 2 hours
} as const;

// Cache Size Configuration
export const CACHE_SIZE = {
  API_DOCS: 500,
  FRAMEWORK_INDEX: 100,
  TECHNOLOGIES: 50,
  UPDATES: 100,
  SAMPLE_CODE: 100,
  TECHNOLOGY_OVERVIEWS: 100,
} as const;

// Request Configuration
export const REQUEST_CONFIG = {
  // Per attempt. A search streams until its results are ready (6 to 17 s in 2026-10-06 runs); this only catches a hang.
  TIMEOUT: 120000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // the first retry's wait; each next one doubles it
} as const;

// Rate Limiting Configuration
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 100,
  WINDOW_MS: 60000, // 1 minute
  SEARCH_SPACING_MS: 15000, // Apple's search API answers quicker searches with no results (2026-10-06)
} as const;

// Processing Limits Configuration
export const PROCESSING_LIMITS = {
  // Limits for slice operations in various tools
  MAX_COLLECTIONS_TO_SHOW: 5,
  MAX_RELATED_APIS_PER_SECTION: 3,
  MAX_PLATFORM_COMPATIBILITY_ITEMS: 2,
  MAX_SIMILAR_APIS_FOR_DEEP_SEARCH: 3,
  MAX_TOPIC_IDENTIFIERS: 4,
} as const;

// Apple Developer URLs
export const APPLE_URLS = {
  BASE: "https://developer.apple.com",
  /** Where pages' images, videos and downloads load from: the pages' <base href>, which swift-docc-render prefixes */
  ASSETS: "https://developer.apple.com/tutorials/",
  SEARCH: "https://developer.apple.com/search/",
  SEARCH_API: "https://devintserv.msc.sbz.apple.com/api/v1/query",
  APP_STORE_CONNECT_HELP: "https://developer.apple.com/help/app-store-connect/",
  TUTORIALS_DATA: "https://developer.apple.com/tutorials/data/",
  TECHNOLOGIES_JSON:
    "https://developer.apple.com/tutorials/data/documentation/technologies.json",
  UPDATES_JSON:
    "https://developer.apple.com/tutorials/data/documentation/Updates.json",
  UPDATES_INDEX_JSON:
    "https://developer.apple.com/tutorials/data/index/updates",
  TECHNOLOGY_OVERVIEWS_JSON:
    "https://developer.apple.com/tutorials/data/documentation/TechnologyOverviews.json",
  TECHNOLOGY_OVERVIEWS_INDEX_JSON:
    "https://developer.apple.com/tutorials/data/index/technologyoverviews",
  SAMPLE_CODE_JSON:
    "https://developer.apple.com/tutorials/data/documentation/SampleCode.json",
  SAMPLE_CODE_INDEX_JSON:
    "https://developer.apple.com/tutorials/data/index/samplecode",
} as const;

// WWDC URLs
export const WWDC_URLS = {
  BASE: "https://developer.apple.com/videos",

  // URL builders
  getYearUrl: (year: string) =>
    `https://developer.apple.com/videos/wwdc${year}/`,
  getVideoUrl: (year: string, videoId: string) =>
    `https://developer.apple.com/videos/play/wwdc${year}/${videoId}/`,
} as const;

// WWDC Configuration
export const WWDC_CONFIG = {
  CODE_TAB_INTRODUCED_YEAR: 2022, // WWDC22 introduced separate code tabs
  // Cache TTL for WWDC data (in milliseconds)
  CACHE_TTL: 60 * 60 * 1000, // 1 hour - increased since data is now bundled
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  PARSE_FAILED: "Failed to parse response data",
  NOT_FOUND:
    "Documentation not found (404). This URL may have been moved or removed.",
  TIMEOUT: "Request timed out. Please try again later.",
  NETWORK_ERROR: "Network error occurred. Please check your connection.",
} as const;
