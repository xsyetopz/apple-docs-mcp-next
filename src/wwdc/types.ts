/**
 * Type definitions for WWDC video data.
 */

/**
 * One timed line of a video transcript.
 */
export interface TranscriptSegment {
	/** Timestamp text copied from the transcript line */
	timestamp: string;
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
	/** Start time parsed from the heading; empty when the heading has none */
	timestamp?: string | undefined;
	title?: string | undefined;
	/** Detected from the class or data-language attribute; defaults to "swift" */
	language: string;
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
	/** Duration text from the video list page */
	duration: string;
	/** Topic names from Apple's topic pages */
	topics: string[];
	hasTranscript: boolean;
	hasCode: boolean;
	transcript?: TranscriptData | undefined;
	codeExamples?: CodeExample[] | undefined;
	chapters?: Chapter[] | undefined;
	resources: VideoResources;
	relatedVideos?: RelatedVideo[] | undefined;
	/** ISO 8601 time of extraction */
	extractedAt?: string | undefined;
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
	topics: {
		id: string;
		name: string;
		url: string;
	}[];
	years: string[];
	statistics: {
		byTopic: Record<string, number>;
		byYear: Record<string, number>;
		videosWithCode: number;
		videosWithTranscript: number;
	};
}

/**
 * One video entry of a topic or year index.
 */
export interface IndexedVideo {
	id: string;
	year: string;
	title: string;
	topics: string[];
	duration: string;
	hasCode: boolean;
	hasTranscript: boolean;
	url: string;
	dataFile: string;
}

/**
 * Index of the videos for one topic.
 */
export interface TopicIndex {
	id: string;
	name: string;
	videoCount: number;
	years: string[];
	videos: IndexedVideo[];
}

/**
 * Index of the videos for one year.
 */
export interface YearIndex {
	year: string;
	videoCount: number;
	topics: string[];
	videos: IndexedVideo[];
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
