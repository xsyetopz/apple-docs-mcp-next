import { beforeEach, describe, expect, type Mock, mock, test } from "bun:test";
/**
 * The WWDC use cases, over a mocked data source
 */

import { handleFindRelatedWWDCVideos } from "../../src/wwdc/find-related-wwdc-videos.ts";
import { handleGetWWDCCodeExamples } from "../../src/wwdc/get-wwdc-code-examples.ts";
import { handleGetWWDCVideo } from "../../src/wwdc/get-wwdc-video.ts";
import { handleListWWDCVideos } from "../../src/wwdc/list-wwdc-videos.ts";
import { handleSearchWWDCContent } from "../../src/wwdc/search-wwdc-content.ts";

// Mock the data source module
mock.module("../../src/wwdc/data-source.ts", () => ({
  loadGlobalMetadata: mock(),
  loadTopicIndex: mock(),
  loadYearIndex: mock(),
  loadVideoData: mock(),
  loadAllVideos: mock(),
  clearDataCache: mock(),
}));

import {
  loadGlobalMetadata,
  loadTopicIndex,
  loadVideoData,
  loadYearIndex,
} from "../../src/wwdc/data-source.ts";

const mockLoadGlobalMetadata = loadGlobalMetadata as Mock<
  (...args: unknown[]) => Promise<unknown>
>;
const mockLoadTopicIndex = loadTopicIndex as Mock<
  (...args: unknown[]) => Promise<unknown>
>;
const mockLoadYearIndex = loadYearIndex as Mock<
  (...args: unknown[]) => Promise<unknown>
>;
const mockLoadVideoData = loadVideoData as Mock<
  (year: string, videoId: string) => Promise<unknown>
>;

describe("WWDC Handlers", () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  describe("handleListWWDCVideos", () => {
    const mockMetadata = {
      version: "1.0",
      lastUpdated: "2025-01-01",
      totalVideos: 1266,
      topics: [
        {
          id: "swiftui-ui-frameworks",
          name: "SwiftUI & UI Frameworks",
          url: "https://developer.apple.com/videos/topics/swiftui-ui-frameworks",
        },
        {
          id: "machine-learning-ai",
          name: "Machine Learning & AI",
          url: "https://developer.apple.com/videos/topics/machine-learning-ai",
        },
      ],
      years: ["2025", "2024", "2023"],
      statistics: {
        byTopic: {},
        byYear: {},
        videosWithCode: 500,
        videosWithTranscript: 1200,
      },
    };

    const mockVideo = {
      id: "10188",
      url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
      title: "Meet the Translation API",
      duration: "15 min",
      topics: ["Machine Learning & AI"],
      hasTranscript: true,
      hasCode: true,
      hasResources: true,
      relatedVideos: [],
      year: "2025",
      resources: {},
    };

    beforeEach(() => {
      mockLoadGlobalMetadata.mockResolvedValue(mockMetadata);
      mockLoadVideoData.mockImplementation((year: string, videoId: string) => {
        if (year === "2025" && videoId === "10188") {
          return Promise.resolve(mockVideo);
        }
        return Promise.reject(new Error("Video not found"));
      });
    });

    test("returns the index when no filter is given", async () => {
      mockLoadGlobalMetadata.mockResolvedValue({
        ...mockMetadata,
        statistics: {
          byTopic: { "machine-learning-ai": 40, "swiftui-ui-frameworks": 60 },
          byYear: { "2025": 122, "2024": 123, "2023": 316 },
          videosWithCode: 500,
          videosWithTranscript: 1200,
        },
      });

      const result = await handleListWWDCVideos({
        year: undefined,
        topic: undefined,
        hasCode: undefined,
        limit: 30,
      });

      expect(result).toContain("Years: 2025 (122), 2024 (123), 2023 (316)");
      expect(result).toContain(
        "Total: 1266 sessions, 500 with code, 1200 with transcript",
      );
      expect(result).toContain(
        "machine-learning-ai (Machine Learning & AI, 40)",
      );
      expect(result).toContain(
        "swiftui-ui-frameworks (SwiftUI & UI Frameworks, 60)",
      );
      expect(mockLoadYearIndex).not.toHaveBeenCalled();
    });

    test("lists the topic IDs when a topic matches nothing", async () => {
      mockLoadYearIndex.mockResolvedValue({
        year: "2025",
        videoCount: 0,
        videos: [],
      });

      const result = await handleListWWDCVideos({
        year: undefined,
        topic: "machine learning",
        hasCode: undefined,
        limit: 30,
      });

      expect(result).toContain("No WWDC videos found");
      expect(result).toContain("machine-learning-ai (Machine Learning & AI)");
    });

    test("should list videos across years with the year on each line", async () => {
      const mockYearIndex = {
        year: "2025",
        videoCount: 1,
        videos: [
          {
            id: "10188",
            year: "2025",
            title: "Meet the Translation API",
            topics: ["Machine Learning & AI"],
            duration: "15 min",
            hasCode: true,
            hasTranscript: true,
            dataFile: "videos/2025-10188.json",
            url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
          },
        ],
      };

      mockLoadYearIndex.mockResolvedValue(mockYearIndex);

      const result = await handleListWWDCVideos({
        year: undefined,
        topic: undefined,
        hasCode: true,
        limit: 50,
      });

      expect(result).toContain("3 of 3 sessions");
      expect(result).toContain(
        "- [Meet the Translation API](https://developer.apple.com/videos/play/wwdc2025/10188/) · 2025 · 15 min · transcript, code · Machine Learning & AI",
      );
      expect(mockLoadGlobalMetadata).toHaveBeenCalled();
      expect(mockLoadYearIndex).toHaveBeenCalledWith("2025");
    });

    test("should filter videos by year", async () => {
      const mockYearIndex = {
        year: "2025",
        videoCount: 1,
        topics: ["Machine Learning & AI"],
        videos: [
          {
            id: "10188",
            year: "2025",
            title: "Meet the Translation API",
            topics: ["Machine Learning & AI"],
            duration: "15 min",
            hasCode: true,
            hasTranscript: true,
            dataFile: "videos/2025-10188.json",
          },
        ],
      };

      mockLoadYearIndex.mockResolvedValue(mockYearIndex);

      const result = await handleListWWDCVideos({
        year: "2025",
        topic: undefined,
        hasCode: undefined,
        limit: 50,
      });

      expect(result).toContain("Meet the Translation API");
      expect(result).not.toContain("· 2025 ·");
      expect(mockLoadYearIndex).toHaveBeenCalledWith("2025");
      expect(mockLoadYearIndex).toHaveBeenCalledTimes(1);
    });

    test("should filter videos by topic", async () => {
      const mockTopicIndex = {
        topicId: "machine-learning-ai",
        name: "Machine Learning & AI",
        videoCount: 1,
        videos: [
          { id: "10188", year: "2025", dataFile: "videos/2025-10188.json" },
        ],
      };

      mockLoadTopicIndex.mockResolvedValue(mockTopicIndex);

      const result = await handleListWWDCVideos({
        year: undefined,
        topic: "machine-learning-ai",
        hasCode: undefined,
        limit: 50,
      });

      expect(result).toContain("Meet the Translation API");
      expect(result).not.toContain("Machine Learning & AI");
      expect(mockLoadTopicIndex).toHaveBeenCalledWith("machine-learning-ai");
    });

    test("should filter videos by code availability", async () => {
      const mockYearIndex = {
        year: "2025",
        videoCount: 2,
        videos: [
          {
            id: "10188",
            year: "2025",
            title: "Meet the Translation API",
            topics: ["Machine Learning & AI"],
            duration: "15 min",
            hasCode: true,
            hasTranscript: true,
            dataFile: "videos/2025-10188.json",
            url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
          },
          {
            id: "10189",
            year: "2025",
            title: "No Code Video",
            topics: ["Machine Learning & AI"],
            duration: "20 min",
            hasCode: false,
            hasTranscript: true,
            dataFile: "videos/2025-10189.json",
            url: "https://developer.apple.com/videos/play/wwdc2025/10189/",
          },
        ],
      };

      const mockVideoWithCode = { ...mockVideo, hasCode: true };
      const mockVideoWithoutCode = {
        ...mockVideo,
        id: "10189",
        title: "No Code Video",
        hasCode: false,
      };

      mockLoadYearIndex.mockResolvedValue(mockYearIndex);
      mockLoadVideoData.mockImplementation((_year: string, videoId: string) => {
        if (videoId === "10188") return Promise.resolve(mockVideoWithCode);
        if (videoId === "10189") return Promise.resolve(mockVideoWithoutCode);
        return Promise.reject(new Error("Video not found"));
      });

      const result = await handleListWWDCVideos({
        year: "2025",
        topic: undefined,
        hasCode: true,
        limit: 50,
      });

      expect(result).toContain("Meet the Translation API");
      expect(result).not.toContain("No Code Video");
    });

    test("rejects with the failure", async () => {
      mockLoadGlobalMetadata.mockRejectedValue(
        new Error("Failed to load metadata"),
      );

      await expect(
        handleListWWDCVideos({
          year: undefined,
          topic: undefined,
          hasCode: undefined,
          limit: 50,
        }),
      ).rejects.toThrow("Failed to load metadata");
    });
  });

  describe("handleSearchWWDCContent", () => {
    const mockSearchVideo = {
      id: "10188",
      url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
      title: "Meet the Translation API",
      description:
        "Discover how you can translate text across different languages",
      duration: "15 min",
      topics: ["Machine Learning & AI"],
      hasTranscript: true,
      hasCode: true,
      hasResources: true,
      transcript: {
        fullText:
          "Welcome to Meet the Translation API\nToday we will explore async await patterns",
        segments: [
          { timestamp: "00:00", text: "Welcome to Meet the Translation API" },
          {
            timestamp: "00:30",
            text: "Today we will explore async await patterns",
          },
        ],
      },
      codeExamples: [
        {
          language: "swift",
          platform: "iOS",
          title: "Basic Translation",
          code: 'let translation = await translator.translate("Hello")',
        },
      ],
      year: "2025",
      relatedVideos: [],
      resources: {},
    };

    beforeEach(() => {
      mockLoadGlobalMetadata.mockResolvedValue({
        version: "1.0",
        lastUpdated: "2025-01-01",
        totalVideos: 1266,
        topics: [],
        years: ["2025", "2024"],
        statistics: {
          byTopic: {
            "swiftui-ui-frameworks": 50,
            "machine-learning-ai": 30,
          },
          byYear: {},
          videosWithCode: 500,
          videosWithTranscript: 1200,
        },
      });

      mockLoadYearIndex.mockResolvedValue({
        year: "2025",
        videoCount: 1,
        topics: ["Machine Learning & AI"],
        videos: [
          {
            id: "10188",
            year: "2025",
            title: "Meet the Translation API",
            topics: ["Machine Learning & AI"],
            duration: "15 min",
            hasCode: true,
            hasTranscript: true,
            dataFile: "videos/2025-10188.json",
          },
        ],
      });

      mockLoadVideoData.mockResolvedValue(mockSearchVideo);
      mockLoadVideoData.mockImplementation((_year: string, videoId: string) => {
        if (videoId === "10188") return Promise.resolve(mockSearchVideo);
        return Promise.reject(new Error("Video not found"));
      });
    });

    test("should search in transcripts", async () => {
      const result = await handleSearchWWDCContent({
        query: "async await",
        searchIn: "transcript",
        year: undefined,
        language: undefined,
        limit: 20,
      });

      expect(result).toContain("WWDC content matches");
      expect(result).toContain("Meet the Translation API");
      expect(result).toContain("async await patterns");
      expect(mockLoadVideoData).toHaveBeenCalled();
    });

    test("should search in code examples", async () => {
      const result = await handleSearchWWDCContent({
        query: "translator",
        searchIn: "code",
        year: undefined,
        language: undefined,
        limit: 20,
      });

      expect(result).toContain("WWDC content matches");
      expect(result).toContain("Basic Translation\n```swift");
      expect(result).toContain("translator.translate");
    });

    test("should search in both transcript and code", async () => {
      const result = await handleSearchWWDCContent({
        query: "translate",
        searchIn: "both",
        year: undefined,
        language: undefined,
        limit: 20,
      });

      expect(result).toContain("Meet the Translation API");
      expect(result).toContain("translator.translate");
    });

    test("should filter by year", async () => {
      const result = await handleSearchWWDCContent({
        query: "translate",
        searchIn: "both",
        year: "2025",
        language: undefined,
        limit: 20,
      });

      expect(result).toContain("Meet the Translation API");
      expect(mockLoadYearIndex).toHaveBeenCalledWith("2025");
      expect(mockLoadYearIndex).toHaveBeenCalledTimes(1);
    });

    test("should filter by language", async () => {
      const result = await handleSearchWWDCContent({
        query: "translate",
        searchIn: "code",
        year: undefined,
        language: "swift",
        limit: 20,
      });

      expect(result).toContain("Basic Translation");
      expect(result).toContain("```swift");
    });

    test("caps a transcript snippet near 300 chars around the match", async () => {
      const filler = "word ".repeat(200);
      mockLoadVideoData.mockResolvedValue({
        ...mockSearchVideo,
        transcript: {
          fullText: `${filler}the async await pattern ${filler}`,
          segments: [],
        },
      });
      mockLoadYearIndex.mockResolvedValue({
        year: "2025",
        videoCount: 1,
        topics: [],
        videos: [
          {
            id: "10188",
            year: "2025",
            title: "Meet the Translation API",
            topics: [],
            duration: "15 min",
            hasCode: false,
            hasTranscript: true,
            dataFile: "videos/2025-10188.json",
          },
        ],
      });

      const result = await handleSearchWWDCContent({
        query: "async await",
        searchIn: "transcript",
        year: "2025",
        language: undefined,
        limit: 20,
      });

      const line = result.split("\n").find((l) => l.startsWith("Transcript"));
      expect(line).toContain("async await pattern");
      expect(line?.includes("…")).toBe(true);
      expect(line?.length).toBeLessThan(330);
    });

    test("shows one heading line per session and no query echo", async () => {
      const result = await handleSearchWWDCContent({
        query: "translator",
        searchIn: "code",
        year: undefined,
        language: undefined,
        limit: 20,
      });

      expect(result).toContain(
        "## [Meet the Translation API](https://developer.apple.com/videos/play/wwdc2025/10188/) (2025)",
      );
      expect(result).not.toContain("Search Query");
      expect(result).not.toContain("Search Scope");
    });

    test("ends with an actionable line when the limit cuts sessions", async () => {
      mockLoadYearIndex.mockResolvedValue({
        year: "2025",
        videoCount: 2,
        topics: [],
        videos: ["10188", "10189"].map((id) => ({
          id,
          year: "2025",
          title: "Meet the Translation API",
          topics: [],
          duration: "15 min",
          hasCode: true,
          hasTranscript: true,
          dataFile: `videos/2025-${id}.json`,
        })),
      });
      mockLoadVideoData.mockImplementation((_year: string, id: string) =>
        Promise.resolve({ ...mockSearchVideo, id }),
      );

      const result = await handleSearchWWDCContent({
        query: "translator",
        searchIn: "code",
        year: "2025",
        language: undefined,
        limit: 1,
      });

      expect(result).toContain("1 of 2 sessions");
      expect(result).toContain("Showing 1 of 2. Narrow with year or language");
    });

    test("should handle no results", async () => {
      const result = await handleSearchWWDCContent({
        query: "nonexistent",
        searchIn: "both",
        year: undefined,
        language: undefined,
        limit: 20,
      });

      expect(result).toContain("No content found");
    });

    test("rejects with the failure", async () => {
      mockLoadGlobalMetadata.mockRejectedValue(new Error("Search failed"));

      await expect(
        handleSearchWWDCContent({
          query: "test",
          searchIn: "both",
          year: undefined,
          language: undefined,
          limit: 20,
        }),
      ).rejects.toThrow("Search failed");
    });
  });

  describe("handleGetWWDCVideo", () => {
    const mockFullVideo = {
      id: "10188",
      url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
      title: "Meet the Translation API",
      duration: "15 min",
      topics: ["Machine Learning & AI"],
      hasTranscript: true,
      hasCode: true,
      hasResources: true,
      transcript: {
        fullText: "Welcome to the session\nLet us begin",
        segments: [
          { timestamp: "00:00", text: "Welcome to the session" },
          { timestamp: "00:30", text: "Let us begin" },
        ],
      },
      codeExamples: [
        {
          language: "swift",
          platform: "iOS",
          title: "Example Code",
          code: 'let example = "code"',
        },
      ],
      resources: {
        resourceLinks: [
          { title: "Download Sample", url: "https://example.com/sample" },
        ],
      },
      relatedVideos: [
        {
          id: "10189",
          year: "2025",
          title: "Related Video 1",
          url: "https://example.com/10189",
        },
        {
          id: "10190",
          year: "2025",
          title: "Related Video 2",
          url: "https://example.com/10190",
        },
      ],
      year: "2025",
    };

    beforeEach(() => {
      mockLoadVideoData.mockResolvedValue(mockFullVideo);
    });

    test("should get full video details with transcript and code", async () => {
      const result = await handleGetWWDCVideo({
        year: "2025",
        videoId: "10188",
        includeTranscript: true,
        includeCode: true,
      });

      expect(result).toContain("Meet the Translation API");
      expect(result).toContain("Welcome to the session");
      expect(result).toContain("Example Code");
      expect(result).toContain("Download Sample");
      expect(mockLoadVideoData).toHaveBeenCalledWith("2025", "10188");
    });

    test("keeps one HD download link and drops the SD one", async () => {
      mockLoadVideoData.mockResolvedValue({
        ...mockFullVideo,
        resources: {
          hdVideo: "https://example.com/hd.mp4",
          sdVideo: "https://example.com/sd.mp4",
        },
      });

      const result = await handleGetWWDCVideo({
        year: "2025",
        videoId: "10188",
        includeTranscript: false,
        includeCode: false,
      });

      expect(result).toContain("https://example.com/hd.mp4");
      expect(result).not.toContain("https://example.com/sd.mp4");
      expect(result).toContain("Machine Learning & AI");
      expect(result).toContain("[Related Video 1](https://example.com/10189)");
    });

    test("drops a first comment line that repeats the example title", async () => {
      mockLoadVideoData.mockResolvedValue({
        ...mockFullVideo,
        codeExamples: [
          {
            language: "swift",
            title: "Creating a Generable struct",
            code: "\n// Creating a Generable struct\n\n@Generable\nstruct S {}",
          },
        ],
      });

      const result = await handleGetWWDCVideo({
        year: "2025",
        videoId: "10188",
        includeTranscript: false,
        includeCode: true,
      });

      expect(result).toContain("```swift\n@Generable\nstruct S {}\n```");
      expect(result).not.toContain("// Creating a Generable struct");
    });

    test("should exclude transcript when requested", async () => {
      const result = await handleGetWWDCVideo({
        year: "2025",
        videoId: "10188",
        includeTranscript: false,
        includeCode: true,
      });

      expect(result).toContain("Meet the Translation API");
      expect(result).not.toContain("Welcome to the session");
      expect(result).toContain("Example Code");
    });

    test("should exclude code when requested", async () => {
      const result = await handleGetWWDCVideo({
        year: "2025",
        videoId: "10188",
        includeTranscript: true,
        includeCode: false,
      });

      expect(result).toContain("Meet the Translation API");
      expect(result).toContain("Welcome to the session");
      expect(result).not.toContain("Example Code");
    });

    test("should handle missing video", async () => {
      mockLoadVideoData.mockRejectedValue(new Error("Video not found"));

      await expect(
        handleGetWWDCVideo({
          year: "2025",
          videoId: "99999",
          includeTranscript: true,
          includeCode: true,
        }),
      ).rejects.toThrow("Video not found");
    });
  });

  describe("handleGetWWDCCodeExamples", () => {
    const mockVideosWithCode = [
      {
        id: "10188",
        url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
        title: "SwiftUI Animations",
        year: "2025",
        duration: "30 min",
        topics: ["SwiftUI & UI Frameworks"],
        hasTranscript: true,
        hasCode: true,
        resources: {},
        codeExamples: [
          {
            language: "swift",
            platform: "iOS",
            title: "Animation Example",
            code: "import SwiftUI\n\nwithAnimation { state.toggle() }",
          },
        ],
      },
      {
        id: "10189",
        url: "https://developer.apple.com/videos/play/wwdc2025/10189/",
        title: "UIKit Updates",
        year: "2025",
        duration: "25 min",
        topics: ["UIKit"],
        hasTranscript: true,
        hasCode: true,
        resources: {},
        codeExamples: [
          {
            language: "swift",
            platform: "iOS",
            title: "UIKit Example",
            code: "let view = UIView()",
          },
        ],
      },
    ];

    beforeEach(() => {
      mockLoadGlobalMetadata.mockResolvedValue({
        version: "1.0",
        lastUpdated: "2025-01-01",
        totalVideos: 1266,
        topics: [],
        years: ["2025"],
        statistics: {
          byTopic: {
            "swiftui-ui-frameworks": 50,
            "machine-learning-ai": 30,
          },
          byYear: {},
          videosWithCode: 500,
          videosWithTranscript: 1200,
        },
      });

      mockLoadYearIndex.mockResolvedValue({
        year: "2025",
        videoCount: 2,
        topics: ["SwiftUI & UI Frameworks", "UIKit"],
        videos: [
          {
            id: "10188",
            year: "2025",
            title: "SwiftUI Animations",
            topics: ["SwiftUI & UI Frameworks"],
            duration: "30 min",
            hasCode: true,
            hasTranscript: true,
            dataFile: "videos/2025-10188.json",
            url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
          },
          {
            id: "10189",
            year: "2025",
            title: "UIKit Updates",
            topics: ["UIKit"],
            duration: "25 min",
            hasCode: true,
            hasTranscript: true,
            dataFile: "videos/2025-10189.json",
            url: "https://developer.apple.com/videos/play/wwdc2025/10189/",
          },
        ],
      });

      mockLoadVideoData.mockImplementation((_year: string, videoId: string) => {
        const video = mockVideosWithCode.find((v) => v.id === videoId);
        if (video) {
          return Promise.resolve(video);
        }
        return Promise.reject(new Error("Video not found"));
      });
    });

    test("should get all code examples", async () => {
      const result = await handleGetWWDCCodeExamples({
        framework: undefined,
        topic: undefined,
        year: undefined,
        language: undefined,
        limit: 30,
      });

      expect(result).toContain("2 of 2 code examples");
      expect(result).toContain(
        "### Animation Example · [SwiftUI Animations](https://developer.apple.com/videos/play/wwdc2025/10188/) · 2025",
      );
      expect(result).toContain("UIKit Example");
    });

    test("should filter by framework", async () => {
      const result = await handleGetWWDCCodeExamples({
        framework: "SwiftUI",
        topic: undefined,
        year: undefined,
        language: undefined,
        limit: 30,
      });

      expect(result).toContain("Animation Example");
      expect(result).not.toContain("UIKit Example");
    });

    test("should filter by language", async () => {
      const result = await handleGetWWDCCodeExamples({
        framework: undefined,
        topic: undefined,
        year: undefined,
        language: "swift",
        limit: 30,
      });

      expect(result).toContain("Animation Example");
      expect(result).toContain("```swift");
      expect(result).not.toContain("Language: swift");
    });

    test("should handle no code examples", async () => {
      const videosWithoutCode = mockVideosWithCode.map((v) => ({
        ...v,
        codeExamples: [],
      }));

      mockLoadVideoData.mockImplementation((_year: string, videoId: string) => {
        const video = videosWithoutCode.find((v) => v.id === videoId);
        if (video) {
          return Promise.resolve(video);
        }
        return Promise.reject(new Error("Video not found"));
      });

      const result = await handleGetWWDCCodeExamples({
        framework: undefined,
        topic: undefined,
        year: undefined,
        language: undefined,
        limit: 30,
      });

      expect(result).toContain("No code examples found");
    });
  });

  describe("handleListWWDCVideos with a topic ID", () => {
    const mockTopics = [
      {
        topicId: "swiftui-ui-frameworks",
        name: "SwiftUI & UI Frameworks",
        videoCount: 50,
        videos: [
          {
            id: "10188",
            year: "2025",
            title: "SwiftUI Animations",
            topics: ["SwiftUI & UI Frameworks"],
            duration: "20 min",
            hasCode: true,
            hasTranscript: true,
            url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
            dataFile: "videos/2025-10188.json",
          },
        ],
      },
      {
        topicId: "machine-learning-ai",
        name: "Machine Learning & AI",
        videoCount: 30,
        videos: [],
      },
    ];

    beforeEach(() => {
      mockLoadGlobalMetadata.mockResolvedValue({
        version: "1.0",
        lastUpdated: "2025-01-01",
        totalVideos: 1266,
        topics: mockTopics.map((t) => ({
          id: t.topicId,
          name: t.name,
          url: `https://developer.apple.com/videos/topics/${t.topicId}`,
        })),
        years: ["2025"],
        statistics: {
          byTopic: {
            "swiftui-ui-frameworks": 50,
            "machine-learning-ai": 30,
          },
          byYear: {},
          videosWithCode: 500,
          videosWithTranscript: 1200,
        },
      });

      mockLoadTopicIndex.mockImplementation((topicId) => {
        const topic = mockTopics.find((t) => t.topicId === topicId);
        return Promise.resolve(topic);
      });

      const mockTranscriptVideo = {
        id: "10188",
        url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
        title: "SwiftUI Animations",
        year: "2025",
        topics: ["SwiftUI & UI Frameworks"],
        duration: "20 min",
        hasTranscript: true,
        hasCode: true,
        resources: {},
      };

      mockLoadVideoData.mockImplementation((_year: string, videoId: string) => {
        if (videoId === "10188") return Promise.resolve(mockTranscriptVideo);
        return Promise.reject(new Error("Video not found"));
      });
    });

    test("lists a topic's sessions with its topic ID, year and limit", async () => {
      mockLoadTopicIndex.mockResolvedValue({
        topicId: "swiftui-ui-frameworks",
        name: "SwiftUI & UI Frameworks",
        videoCount: 3,
        videos: [
          { id: "10188", year: "2025", dataFile: "videos/2025-10188.json" },
          { id: "10187", year: "2024", dataFile: "videos/2024-10187.json" },
          { id: "10186", year: "2025", dataFile: "videos/2025-10186.json" },
        ],
      });
      mockLoadVideoData.mockImplementation((year: string, videoId: string) =>
        Promise.resolve({
          id: videoId,
          url: `https://developer.apple.com/videos/play/wwdc${year}/${videoId}/`,
          title: `Session ${videoId}`,
          year,
          topics: ["SwiftUI & UI Frameworks"],
          duration: "20 min",
          hasTranscript: true,
          hasCode: false,
          resources: {},
        }),
      );

      const result = await handleListWWDCVideos({
        year: "2025",
        topic: "swiftui-ui-frameworks",
        hasCode: undefined,
        limit: 1,
      });

      expect(mockLoadTopicIndex).toHaveBeenCalledWith("swiftui-ui-frameworks");
      expect(result).toContain("1 of 2 sessions");
      expect(result).toContain("Session 10188");
      expect(result).not.toContain("Session 10187");
      expect(result).toContain(
        "Showing 1 of 2. Narrow with year or topic, or raise limit.",
      );
    });
  });

  describe("handleFindRelatedWWDCVideos", () => {
    const mockSourceVideo = {
      id: "10188",
      title: "SwiftUI Basics",
      year: "2025",
      url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
      duration: "30 min",
      topics: ["SwiftUI & UI Frameworks"],
      relatedVideos: [
        {
          id: "10189",
          year: "2025",
          title: "Advanced SwiftUI",
          url: "https://example.com/10189",
        },
        {
          id: "10190",
          year: "2024",
          title: "SwiftUI Performance",
          url: "https://example.com/10190",
        },
      ],
      hasTranscript: true,
      hasCode: true,
      resources: {},
    };

    const mockRelatedVideos = [
      {
        id: "10189",
        title: "Advanced SwiftUI",
        year: "2025",
        url: "https://developer.apple.com/videos/play/wwdc2025/10189/",
        duration: "25 min",
        topics: ["SwiftUI & UI Frameworks"],
        hasTranscript: true,
        hasCode: true,
        resources: {},
      },
      {
        id: "10190",
        title: "SwiftUI Performance",
        year: "2024",
        url: "https://developer.apple.com/videos/play/wwdc2024/10190/",
        duration: "20 min",
        topics: ["SwiftUI & UI Frameworks", "Performance"],
        hasTranscript: true,
        hasCode: false,
        resources: {},
      },
    ];

    beforeEach(() => {
      mockLoadVideoData.mockImplementation((_year: string, videoId: string) => {
        if (videoId === "10188") return Promise.resolve(mockSourceVideo);
        const video = mockRelatedVideos.find((v) => v.id === videoId);
        if (video) return Promise.resolve(video);
        return Promise.reject(new Error("Video not found"));
      });
    });

    test("should find explicitly related videos", async () => {
      const result = await handleFindRelatedWWDCVideos({
        videoId: "10188",
        year: "2025",
        includeExplicitRelated: true,
        includeTopicRelated: true,
        includeYearRelated: false,
        limit: 15,
      });

      expect(result).toContain("# Related to [SwiftUI Basics]");
      expect(result).toContain(
        "- [Advanced SwiftUI](https://developer.apple.com/videos/play/wwdc2025/10189/) · 2025 · 25 min · Explicitly related · transcript, code",
      );
      expect(result).toContain(
        "· 2024 · 20 min · Explicitly related · transcript",
      );
    });

    test("should exclude explicit related when requested", async () => {
      const result = await handleFindRelatedWWDCVideos({
        videoId: "10188",
        year: "2025",
        includeExplicitRelated: false,
        includeTopicRelated: true,
        includeYearRelated: false,
        limit: 15,
      });

      expect(result).toContain("# Related to [SwiftUI Basics]");
      // When no videos found
      expect(result).toContain("No related videos found");
    });

    test("should handle video not found", async () => {
      mockLoadVideoData.mockRejectedValue(new Error("Video not found"));

      await expect(
        handleFindRelatedWWDCVideos({
          videoId: "99999",
          year: "2025",
          includeExplicitRelated: true,
          includeTopicRelated: true,
          includeYearRelated: false,
          limit: 15,
        }),
      ).rejects.toThrow("Video not found");
    });
  });
});
