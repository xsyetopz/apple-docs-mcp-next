/**
 * Zod schemas for WWDC tools
 */

import { z } from "zod";

/**
 * Schema for list_wwdc_videos
 */
export const listWWDCVideosSchema = z.object({
  year: z
    .string()
    .optional()
    .describe(
      'WWDC year ("2025", "2024", etc.) or "all"; list_wwdc_years lists the years held. Example: "2025" for latest.',
    ),
  topic: z
    .string()
    .optional()
    .describe(
      'A topic ID keeps that topic\'s sessions: "accessibility-inclusion", "app-services", "app-store-distribution-marketing", "audio-video", "business-education", "design", "developer-tools", "essentials", "graphics-games", "health-fitness", "machine-learning-ai", "maps-location", "photos-camera", "privacy-security", "safari-web", "spatial-computing", "swift", "swiftui-ui-frameworks", "system-services". Any other text keeps the sessions whose title or topic names contain it.',
    ),
  hasCode: z
    .boolean()
    .optional()
    .describe(
      "Filter by code availability. true = sessions with code, false = without code. Leave empty for all.",
    ),
  limit: z
    .number()
    .min(1)
    .max(200)
    .default(50)
    .describe(
      "Max videos to show (default: 50). Videos include title, duration, and content indicators.",
    ),
});

/**
 * Schema for search_wwdc_content
 */
export const searchWWDCContentSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Search terms. Examples: "async await", "@Observable", "Vision Pro", "performance optimization".',
    ),
  searchIn: z
    .enum(["transcript", "code", "both"])
    .default("both")
    .describe(
      'Search scope. "transcript" = spoken content, "code" = code examples only, "both" = everything. Default: "both"',
    ),
  year: z
    .string()
    .optional()
    .describe(
      'Limit to specific year ("2025", "2024", etc.). Leave empty for all years.',
    ),
  language: z
    .string()
    .optional()
    .describe(
      'Code language filter ("swift", "objc", "javascript"). Only for code search.',
    ),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(20)
    .describe("Max results (default: 20). Results include context snippets."),
});

/**
 * Schema for get_wwdc_video
 */
export const getWWDCVideoSchema = z.object({
  year: z.string().describe('WWDC year. Example: "2025"'),
  videoId: z
    .string()
    .describe(
      'Session ID. Example: "10101" for keynote, "238" for session 238.',
    ),
  includeTranscript: z
    .boolean()
    .default(true)
    .describe(
      "Include the full transcript, as plain text without timestamps. Default: true",
    ),
  includeCode: z
    .boolean()
    .default(true)
    .describe("Include all code examples from the session. Default: true"),
});

/**
 * Schema for get_wwdc_code_examples
 */
export const getWWDCCodeExamplesSchema = z.object({
  framework: z
    .string()
    .optional()
    .describe(
      'Framework to find examples for. Examples: "SwiftUI", "SwiftData", "RealityKit".',
    ),
  topic: z
    .string()
    .optional()
    .describe(
      'A topic ID from browse_wwdc_topics, such as "swift" or "swiftui-ui-frameworks", keeps that topic\'s sessions; any other text, such as "animation", keeps the sessions whose title or topic names contain it.',
    ),
  year: z
    .string()
    .optional()
    .describe('WWDC year filter ("2025", "2024", etc.).'),
  language: z
    .string()
    .optional()
    .describe('Programming language: "swift", "objc", "javascript", "metal".'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(30)
    .describe(
      "Max examples (default: 30). Each includes code and source video info.",
    ),
});

/**
 * Schema for browse_wwdc_topics
 */
export const browseWWDCTopicsSchema = z.object({
  topicId: z
    .string()
    .optional()
    .describe(
      'Topic ID to explore. Available IDs: "accessibility-inclusion", "app-services", "app-store-distribution-marketing", "audio-video", "business-education", "design", "developer-tools", "essentials", "graphics-games", "health-fitness", "machine-learning-ai", "maps-location", "photos-camera", "privacy-security", "safari-web", "spatial-computing", "swift", "swiftui-ui-frameworks", "system-services". Leave empty to see all topics with video counts.',
    ),
  includeVideos: z
    .boolean()
    .default(true)
    .describe(
      "List videos in the topic. Set false for topic structure only. Default: true",
    ),
  year: z
    .string()
    .optional()
    .describe(
      "Filter topic videos by year. Only when browsing specific topic.",
    ),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(20)
    .describe("Max videos per topic (default: 20)."),
});

/**
 * Schema for find_related_wwdc_videos
 */
export const findRelatedWWDCVideosSchema = z.object({
  videoId: z
    .string()
    .describe('Source video ID. Example: "10101" for keynote.'),
  year: z.string().describe('Source video year. Example: "2025"'),
  includeExplicitRelated: z
    .boolean()
    .default(true)
    .describe(
      "Include Apple's recommended related videos. Usually prerequisites or follow-ups. Default: true",
    ),
  includeTopicRelated: z
    .boolean()
    .default(true)
    .describe(
      "Include videos from same topic categories. Good for comprehensive learning. Default: true",
    ),
  includeYearRelated: z
    .boolean()
    .default(false)
    .describe("Include other videos from same WWDC. Default: false"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(15)
    .describe("Max related videos (default: 15)."),
});

/**
 * Schema for list_wwdc_years
 */
export const listWWDCYearsSchema = z.object({});
