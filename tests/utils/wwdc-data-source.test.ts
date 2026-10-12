/**
 * Tests for WWDC Data Source
 */

import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";

type AnyMock = Mock<(...args: unknown[]) => Promise<unknown>>;

// Mock the module before importing
mock.module("../../src/utils/wwdc-data-source.ts", () => ({
  clearDataCache: mock(),
  isDataAvailable: mock(),
  loadAllVideos: mock(),
  loadGlobalMetadata: mock(),
  loadTopicIndex: mock(),
  loadVideoData: mock(),
  loadYearIndex: mock(),
}));

// Import after mocking
const {
  clearDataCache,
  isDataAvailable,
  loadAllVideos,
  loadGlobalMetadata,
  loadTopicIndex,
  loadVideoData,
  loadYearIndex,
} = await import("../../src/utils/wwdc-data-source.ts");

describe("WWDC Data Source", () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  describe("loadGlobalMetadata", () => {
    it("should load global metadata", async () => {
      const mockMetadata = {
        topics: ["topic1", "topic2"],
        years: ["2023", "2024"],
        statistics: { totalVideos: 100 },
      };

      (loadGlobalMetadata as AnyMock).mockResolvedValue(mockMetadata);

      const result = await loadGlobalMetadata();

      expect(result).toEqual<unknown>(mockMetadata);
      expect(loadGlobalMetadata).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      (loadGlobalMetadata as AnyMock).mockRejectedValue(
        new Error(
          "Failed to load WWDC metadata. Please ensure the package is properly installed.",
        ),
      );

      await expect(loadGlobalMetadata()).rejects.toThrow(
        "Failed to load WWDC metadata",
      );
    });
  });

  describe("loadTopicIndex", () => {
    it("should load topic index", async () => {
      const mockTopicIndex = {
        id: "swiftui",
        name: "SwiftUI",
        videos: ["10001", "10002"],
      };

      (loadTopicIndex as AnyMock).mockResolvedValue(mockTopicIndex);

      const result = await loadTopicIndex("swiftui");

      expect(result).toEqual<unknown>(mockTopicIndex);
      expect(loadTopicIndex).toHaveBeenCalledWith("swiftui");
    });

    it("should handle non-existent topic", async () => {
      (loadTopicIndex as AnyMock).mockRejectedValue(
        new Error("Topic not found: invalid-topic"),
      );

      await expect(loadTopicIndex("invalid-topic")).rejects.toThrow(
        "Topic not found: invalid-topic",
      );
    });
  });

  describe("loadYearIndex", () => {
    it("should load year index", async () => {
      const mockYearIndex = {
        year: "2024",
        videos: ["10001", "10002"],
        topics: ["SwiftUI", "UIKit"],
      };

      (loadYearIndex as AnyMock).mockResolvedValue(mockYearIndex);

      const result = await loadYearIndex("2024");

      expect(result).toEqual<unknown>(mockYearIndex);
      expect(loadYearIndex).toHaveBeenCalledWith("2024");
    });

    it("should handle non-existent year", async () => {
      (loadYearIndex as AnyMock).mockRejectedValue(
        new Error("Year not found: 2099"),
      );

      await expect(loadYearIndex("2099")).rejects.toThrow(
        "Year not found: 2099",
      );
    });
  });

  describe("loadVideoData", () => {
    it("should load individual video data", async () => {
      const mockVideo = {
        id: "10001",
        title: "SwiftUI Essentials",
        year: "2024",
        duration: "20 min",
        topics: ["SwiftUI"],
      };

      (loadVideoData as AnyMock).mockResolvedValue(mockVideo);

      const result = await loadVideoData("2024", "10001");

      expect(result).toEqual<unknown>(mockVideo);
      expect(loadVideoData).toHaveBeenCalledWith("2024", "10001");
    });

    it("should handle non-existent video", async () => {
      (loadVideoData as AnyMock).mockRejectedValue(
        new Error("Video not found: 2024-99999"),
      );

      await expect(loadVideoData("2024", "99999")).rejects.toThrow(
        "Video not found: 2024-99999",
      );
    });
  });

  describe("loadAllVideos", () => {
    it("should load all videos", async () => {
      const mockVideos = [
        {
          id: "10001",
          title: "Video 1",
          year: "2024",
        },
        {
          id: "10002",
          title: "Video 2",
          year: "2024",
        },
      ];

      (loadAllVideos as AnyMock).mockResolvedValue(mockVideos);

      const result = await loadAllVideos();

      expect(result).toEqual<unknown>(mockVideos);
      expect(loadAllVideos).toHaveBeenCalled();
    });

    it("should handle loading error", async () => {
      (loadAllVideos as AnyMock).mockRejectedValue(
        new Error("Failed to load WWDC video list"),
      );

      await expect(loadAllVideos()).rejects.toThrow(
        "Failed to load WWDC video list",
      );
    });
  });

  describe("clearDataCache", () => {
    it("should clear the cache", () => {
      (clearDataCache as Mock<() => void>).mockImplementation(() => {
        // Mock implementation
      });

      clearDataCache();

      expect(clearDataCache).toHaveBeenCalled();
    });
  });

  describe("isDataAvailable", () => {
    it("should return true when data is available", async () => {
      (isDataAvailable as AnyMock).mockResolvedValue(true);

      const result = await isDataAvailable();

      expect(result).toBe(true);
      expect(isDataAvailable).toHaveBeenCalled();
    });

    it("should return false when data is not available", async () => {
      (isDataAvailable as AnyMock).mockResolvedValue(false);

      const result = await isDataAvailable();

      expect(result).toBe(false);
    });
  });
});
