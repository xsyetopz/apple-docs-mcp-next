import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";
import { searchFrameworkSymbols } from "../../src/docs/search-framework-symbols.ts";
import { createTestFrameworkIndex, mockData } from "../helpers/test-helpers.ts";
import { httpClientModule } from "../mocks/http-client.mock.ts";

// Mock dependencies
mock.module("../../src/core/cache.ts", () => ({
  indexCache: { get: mock(), set: mock(), has: mock() },
  generateUrlCacheKey: mock(
    (url: string, params: Record<string, unknown>) =>
      `${url}?${JSON.stringify(params)}`,
  ),
}));
mock.module("../../src/core/http-client.ts", httpClientModule);

import { indexCache } from "../../src/core/cache.ts";
import { httpClient } from "../../src/core/http-client.ts";

describe("searchFrameworkSymbols", () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  describe("successful searches", () => {
    it("should search for classes in UIKit framework", async () => {
      // Mock cache miss
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );

      // Mock HTTP response
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue(mockData.frameworkIndex);

      const result = await searchFrameworkSymbols(
        "uikit",
        "class",
        undefined,
        "swift",
        10,
      );

      expect(httpClient.getJson).toHaveBeenCalledWith(
        "https://developer.apple.com/tutorials/data/index/uikit",
      );
      expect(result).toContain("UIView");
      expect(result).toContain("UIViewController");
      expect(result).toContain("Found:** 4 classes");
      expect(indexCache.set).toHaveBeenCalled();
    });

    it("should search with wildcard pattern", async () => {
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue(mockData.frameworkIndex);

      const result = await searchFrameworkSymbols(
        "uikit",
        "class",
        "*View",
        "swift",
        10,
      );

      expect(result).toContain("UIView");
      expect(result).toContain("UITableView");
      expect(result).toContain("UIStackView");
      expect(result).not.toContain("UIViewController");
      expect(result).toContain('matching "*View"');
    });

    it("should search all symbol types", async () => {
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue(mockData.frameworkIndex);

      const result = await searchFrameworkSymbols(
        "uikit",
        "all",
        undefined,
        "swift",
        10,
      );

      expect(result).toContain("## Classes (4)");
      expect(result).toContain("## Structs (1)");
      expect(result).toContain("UIView");
      expect(result).toContain("List");
    });

    it("should use cache when available", async () => {
      const cachedResult = "# Cached Result";
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        cachedResult,
      );

      const result = await searchFrameworkSymbols(
        "uikit",
        "class",
        undefined,
        "swift",
        10,
      );

      expect(result).toBe(cachedResult);
      expect(httpClient.getJson).not.toHaveBeenCalled();
    });

    it("should respect limit parameter", async () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        path: `/documentation/uikit/class${i}`,
        title: `Class${i}`,
        type: "class",
        beta: false,
        deprecated: false,
        children: [],
      }));

      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue(createTestFrameworkIndex(manyItems));

      const result = await searchFrameworkSymbols(
        "uikit",
        "class",
        undefined,
        "swift",
        5,
      );

      // Count occurrences of class links
      const classLinks = (result.match(/\[.*?\]/g) || []).length;
      expect(classLinks).toBe(5);
    });

    it("should support Objective-C language", async () => {
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue(mockData.frameworkIndex);

      const result = await searchFrameworkSymbols(
        "uikit",
        "class",
        undefined,
        "occ",
        10,
      );

      expect(result).toContain("UIView");
      expect(result).toContain("Found:** 1 classes");
    });
  });

  describe("error cases", () => {
    it("should handle invalid framework gracefully", async () => {
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockRejectedValue(new Error("404 Not Found"));

      const result = await searchFrameworkSymbols(
        "invalidframework",
        "class",
        undefined,
        "swift",
        10,
      );

      expect(result).toContain("Error searching classes: 404 Not Found");
    });

    it("should handle empty framework name", async () => {
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockRejectedValue(new Error("Invalid URL"));

      const result = await searchFrameworkSymbols(
        "",
        "class",
        undefined,
        "swift",
        10,
      );

      expect(result).toContain("Error searching classes");
    });

    it("should handle unsupported language", async () => {
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue({
        interfaceLanguages: {
          swift: mockData.frameworkIndex.interfaceLanguages.swift,
        },
      });

      const result = await searchFrameworkSymbols(
        "uikit",
        "class",
        undefined,
        "java",
        10,
      );

      expect(result).toContain('Language "java" not available');
      expect(result).toContain("Available languages: swift");
    });

    it("should handle no results gracefully", async () => {
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue({
        interfaceLanguages: {
          swift: [
            {
              path: "/documentation/uikit/uiview",
              title: "UIView",
              type: "class", // Not a macro
              beta: false,
              deprecated: false,
              children: [],
            },
          ],
        },
      });

      const result = await searchFrameworkSymbols(
        "uikit",
        "macro",
        undefined,
        "swift",
        10,
      );

      expect(result).toContain("No macros found in uikit framework");
    });

    it("should handle network errors", async () => {
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockRejectedValue(new Error("Network error"));

      const result = await searchFrameworkSymbols(
        "uikit",
        "class",
        undefined,
        "swift",
        10,
      );

      expect(result).toContain("Error searching classes: Network error");
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in pattern", async () => {
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue(mockData.frameworkIndex);

      const result = await searchFrameworkSymbols(
        "uikit",
        "class",
        "UI[View]*",
        "swift",
        10,
      );

      // Special characters should be escaped, so no matches
      expect(result).toContain('No classes found matching pattern "UI[View]*"');
    });

    it("should handle deeply nested items", async () => {
      const nestedIndex = createTestFrameworkIndex([
        {
          path: "/documentation/uikit/views",
          title: "Views",
          type: "collection",
          children: [
            {
              path: "/documentation/uikit/views/basic",
              title: "Basic Views",
              type: "collection",
              children: [
                {
                  path: "/documentation/uikit/uiview",
                  title: "UIView",
                  type: "class",
                  children: [],
                },
              ],
            },
          ],
        },
      ]);

      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue(nestedIndex);

      const result = await searchFrameworkSymbols(
        "uikit",
        "class",
        undefined,
        "swift",
        10,
      );

      expect(result).toContain("UIView");
      expect(result).toContain("Found:** 1 classes");
    });

    it("should handle framework name case variations", async () => {
      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue(mockData.frameworkIndex);

      // Test different case variations
      await searchFrameworkSymbols("UIKit", "class", undefined, "swift", 1);
      await searchFrameworkSymbols("UIKIT", "class", undefined, "swift", 1);
      await searchFrameworkSymbols("uikit", "class", undefined, "swift", 1);

      // All should call the same lowercase URL
      expect(httpClient.getJson).toHaveBeenCalledWith(
        "https://developer.apple.com/tutorials/data/index/uikit",
      );
      expect(httpClient.getJson).toHaveBeenCalledTimes(3);
    });

    it("should handle items with beta and deprecated flags", async () => {
      const flaggedIndex = createTestFrameworkIndex([
        {
          path: "/documentation/uikit/betaclass",
          title: "BetaClass",
          type: "class",
          beta: true,
          deprecated: false,
          children: [],
        },
        {
          path: "/documentation/uikit/deprecatedclass",
          title: "DeprecatedClass",
          type: "class",
          beta: false,
          deprecated: true,
          children: [],
        },
      ]);

      (indexCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
        null,
      );
      (
        httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
      ).mockResolvedValue(flaggedIndex);

      const result = await searchFrameworkSymbols(
        "uikit",
        "class",
        undefined,
        "swift",
        10,
      );

      expect(result).toContain("BetaClass**");
      expect(result).toContain("*(Beta, Class)*");
      expect(result).toContain("DeprecatedClass**");
      expect(result).toContain("*(Deprecated, Class)*");
    });
  });
});
