import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from "bun:test";
import { httpClientModule } from "../mocks/http-client.mock.ts";

/**
 * Integration tests for WWDC tools
 */

// Mock dependencies BEFORE any imports
mock.module("../../src/core/http-client.ts", httpClientModule);
mock.module("../../src/wwdc/data-source.ts", () => ({
  loadGlobalMetadata: mock(),
  loadTopicIndex: mock(),
  loadYearIndex: mock(),
  loadVideoData: mock(),
  loadAllVideos: mock(),
  clearDataCache: mock(),
}));

import { Client, InMemoryTransport } from "@modelcontextprotocol/client";

// Import mocked functions
import {
  loadAllVideos,
  loadGlobalMetadata,
  loadTopicIndex,
  loadVideoData,
  loadYearIndex,
} from "../../src/wwdc/data-source.ts";

const { createServer } = await import("../../src/server.ts");

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
  (...args: unknown[]) => Promise<unknown>
>;
const mockLoadAllVideos = loadAllVideos as Mock<
  (...args: unknown[]) => Promise<unknown>
>;

describe("WWDC Tools Integration", () => {
  let client: Client;
  const call = async (
    name: string,
    args: Record<string, unknown>,
  ): Promise<{ content: { text?: string }[] }> =>
    (await client.callTool({ name, arguments: args })) as {
      content: { text?: string }[];
    };

  beforeEach(async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test", version: "test" });
    await Promise.all([
      createServer().connect(serverSide),
      client.connect(clientSide),
    ]);

    mock.clearAllMocks();

    // Setup default mocks
    mockLoadGlobalMetadata.mockResolvedValue({
      version: "1.0",
      lastUpdated: "2025-01-01",
      totalVideos: 100,
      topics: [
        { id: "swiftui", name: "SwiftUI", url: "https://example.com" },
        {
          id: "swiftui-ui-frameworks",
          name: "SwiftUI & UI Frameworks",
          url: "https://example.com",
        },
      ],
      years: ["2025", "2024"],
      statistics: {
        byTopic: { swiftui: 10 },
        byYear: { "2025": 50, "2024": 50 },
        videosWithCode: 80,
        videosWithTranscript: 90,
      },
    });

    mockLoadYearIndex.mockResolvedValue({
      year: "2025",
      videoCount: 50,
      topics: ["SwiftUI", "UIKit"],
      videos: [
        {
          id: "10001",
          year: "2025",
          title: "Test Video",
          topics: ["SwiftUI"],
          duration: "20 min",
          hasCode: true,
          hasTranscript: true,
          dataFile: "videos/2025-10001.json",
          url: "https://example.com/10001",
        },
      ],
    });

    mockLoadVideoData.mockResolvedValue({
      id: "10001",
      title: "Test Video",
      year: "2025",
      duration: "20 min",
      topics: ["SwiftUI"],
      hasTranscript: true,
      hasCode: true,
      transcript: {
        fullText: "Test transcript content",
        segments: [],
      },
      codeExamples: [
        {
          language: "swift",
          platform: "iOS",
          title: "Example",
          code: 'print("Hello")',
        },
      ],
      resources: {
        download: "https://example.com/download",
      },
      relatedVideos: [],
      url: "https://example.com/10001",
      description: "Test video description",
      speakers: [],
    });

    mockLoadTopicIndex.mockResolvedValue({
      topicId: "swiftui-ui-frameworks",
      topicName: "SwiftUI & UI Frameworks",
      videoCount: 10,
      videos: ["videos/2025-10001.json"],
    });

    mockLoadAllVideos.mockResolvedValue([
      {
        id: "10001",
        title: "Test Video",
        year: "2025",
        topics: ["SwiftUI"],
      },
    ]);
  });

  afterEach(async () => {
    await client.close();
  });

  describe("list_wwdc_videos", () => {
    it("should return the index without arguments", async () => {
      const result = await call("list_wwdc_videos", {});

      expect(result).toHaveProperty("content");
      expect(result.content[0]?.text).toContain("Years:");
      expect(result.content[0]?.text).toContain("2025");
      expect(result.content[0]?.text).toContain("2024");
      expect(mockLoadGlobalMetadata).toHaveBeenCalled();
    });

    it("should filter videos by year", async () => {
      const result = await call("list_wwdc_videos", { year: "2025" });

      expect(result.content[0]?.text).toContain("sessions");
      expect(mockLoadYearIndex).toHaveBeenCalledWith("2025");
    });

    it("should filter videos by topic", async () => {
      await call("list_wwdc_videos", {
        topic: "swiftui-ui-frameworks",
      });

      expect(mockLoadTopicIndex).toHaveBeenCalledWith("swiftui-ui-frameworks");
    });
  });

  describe("search_wwdc_content", () => {
    it("should search WWDC content", async () => {
      const result = await call("search_wwdc_content", { query: "SwiftUI" });

      expect(result).toHaveProperty("content");
      expect(mockLoadGlobalMetadata).toHaveBeenCalled();
    });

    it("should search with filters", async () => {
      await call("search_wwdc_content", {
        query: "animation",
        year: "2025",
        searchInTranscript: true,
        searchInCode: true,
      });

      expect(mockLoadYearIndex).toHaveBeenCalledWith("2025");
    });
  });

  describe("get_wwdc_video", () => {
    it("should get video details", async () => {
      const result = await call("get_wwdc_video", {
        videoId: "10001",
        year: "2025",
      });

      expect(result.content[0]?.text).toContain("Test Video");
      expect(mockLoadVideoData).toHaveBeenCalledWith("2025", "10001");
    });

    it("should include transcript when requested", async () => {
      const result = await call("get_wwdc_video", {
        videoId: "10001",
        year: "2025",
        includeTranscript: true,
      });

      expect(result.content[0]?.text).toContain("transcript");
    });
  });

  describe("get_wwdc_code_examples", () => {
    it("should get code examples", async () => {
      const result = await call("get_wwdc_code_examples", {});

      expect(result).toHaveProperty("content");
      expect(mockLoadGlobalMetadata).toHaveBeenCalled();
    });

    it("should filter by framework", async () => {
      const result = await call("get_wwdc_code_examples", {
        framework: "SwiftUI",
      });

      expect(result).toHaveProperty("content");
    });
  });

  describe("find_related_wwdc_videos", () => {
    it("should find related videos", async () => {
      const result = await call("find_related_wwdc_videos", {
        videoId: "10001",
        year: "2025",
      });

      expect(result).toHaveProperty("content");
      expect(mockLoadVideoData).toHaveBeenCalledWith("2025", "10001");
    });
  });

  describe("error handling", () => {
    it("should handle data loading errors gracefully", async () => {
      mockLoadGlobalMetadata.mockRejectedValue(new Error("Network error"));

      const result = await call("list_wwdc_videos", {});

      expect(result.content[0]?.text).toContain("Error");
    });

    it("should handle invalid video ID", async () => {
      mockLoadVideoData.mockRejectedValue(new Error("Video not found"));

      const result = await call("get_wwdc_video", {
        videoId: "invalid",
        year: "2025",
      });

      expect(result.content[0]?.text).toContain("Error");
    });
  });
});
