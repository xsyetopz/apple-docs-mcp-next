/**
 * Type definitions for WWDC video data.
 */

/**
 * One timed line of a video transcript.
 */
export interface TranscriptSegment {
  timestamp: string; // Timestamp text copied from the transcript line
  text: string;
}

/**
 * Transcript text for a video, as full text and timed segments.
 */
export interface TranscriptData {
  fullText: string;
  segments: TranscriptSegment[];
}

/**
 * A code snippet shown in a video.
 */
export interface CodeExample {
  timestamp?: string | undefined; // Start time parsed from the heading; empty when the heading has none
  title?: string | undefined;
  language: string; // Detected from the class or data-language attribute; defaults to "swift"
  code: string;
  context?: string | undefined;
}

/**
 * A titled link attached to a video.
 */
interface ResourceLink {
  title: string;
  url: string;
}

/**
 * Downloadable resources attached to a video.
 */
export interface VideoResources {
  hdVideo?: string;
  sdVideo?: string;
  sampleProject?: string;
  slides?: string;
  resourceLinks?: ResourceLink[];
}

/**
 * A video related to another video.
 */
export interface RelatedVideo {
  id: string;
  year: string;
  title: string;
  url: string;
}

/**
 * A WWDC video record.
 */
export interface WWDCVideo {
  id: string;
  year: string;
  url: string;
  title: string;
  speakers?: string[] | undefined;
  duration: string; // Duration text from the video list page
  topics: string[]; // Topic names from Apple's topic pages
  hasTranscript: boolean;
  hasCode: boolean;
  transcript?: TranscriptData | undefined;
  codeExamples?: CodeExample[] | undefined;
  chapters?: Chapter[] | undefined;
  resources: VideoResources;
  relatedVideos?: RelatedVideo[] | undefined;
  extractedAt?: string | undefined; // ISO 8601 time of extraction
}

/**
 * A chapter marker within a video.
 */
export interface Chapter {
  title: string;
  timestamp: string;
  duration?: string;
}

/**
 * Dataset-wide metadata.
 */
export interface GlobalMetadata {
  version: string;
  lastUpdated: string;
  totalVideos: number;
  topics: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  years: string[];
  statistics: {
    byTopic: Record<string, number>;
    byYear: Record<string, number>;
    videosWithCode: number;
    videosWithTranscript: number;
  };
}

/**
 * Index of the videos for one topic.
 */
export interface TopicIndex {
  id: string;
  name: string;
  videoCount: number;
  years: string[];
  videos: Array<{
    id: string;
    year: string;
    title: string;
    topics: string[];
    duration: string;
    hasCode: boolean;
    hasTranscript: boolean;
    url: string;
    dataFile: string;
  }>;
}

/**
 * Index of the videos for one year.
 */
export interface YearIndex {
  year: string;
  videoCount: number;
  topics: string[];
  videos: Array<{
    id: string;
    year: string;
    title: string;
    topics: string[];
    duration: string;
    hasCode: boolean;
    hasTranscript: boolean;
    url: string;
    dataFile: string;
  }>;
}

/**
 * A video entry scraped from a list page.
 */
export interface VideoListItem {
  id: string;
  url: string;
  title: string;
  duration?: string;
  thumbnail?: string;
}
