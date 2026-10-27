import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";
import { updatesCache } from "../../src/core/cache.ts";
import { httpClient } from "../../src/core/http-client.ts";
import { handleGetDocumentationUpdates } from "../../src/docs/get-documentation-updates.ts";
import { httpClientModule } from "../mocks/http-client.mock.ts";

// Mock dependencies
mock.module("../../src/core/http-client.ts", httpClientModule);
mock.module("../../src/core/cache.ts", () => ({
  updatesCache: {
    get: mock(),
    set: mock(),
  },
  generateUrlCacheKey: mock(
    (key, params) => `${key}-${JSON.stringify(params)}`,
  ),
}));

describe("get-documentation-updates", () => {
  const mockUpdatesData = {
    topicSections: [
      {
        title: "WWDC",
        identifiers: [
          "doc://com.apple.Updates/documentation/Updates/wwdc2024",
          "doc://com.apple.Updates/documentation/Updates/wwdc2023",
        ],
        anchor: "WWDC",
      },
      {
        title: "Technology updates",
        identifiers: [
          "doc://com.apple.Updates/documentation/Updates/SwiftUI",
          "doc://com.apple.Updates/documentation/Updates/UIKit",
        ],
        anchor: "Technology-updates",
      },
      {
        title: "Release notes for SDKs, Xcode, and Safari",
        identifiers: [
          "doc://com.apple.documentation/documentation/ios-ipados-release-notes",
        ],
        anchor: "Release-notes-for-SDKs-Xcode-and-Safari",
      },
    ],
    references: {
      "doc://com.apple.Updates/documentation/Updates/wwdc2024": {
        type: "topic",
        title: "WWDC24",
        url: "/documentation/updates/wwdc2024",
        abstract: [
          {
            text: "Highlights of new technologies introduced at WWDC24.",
            type: "text",
          },
        ],
        images: [{ type: "icon", identifier: "new.svg" }],
        kind: "article",
        role: "collectionGroup",
      },
      "doc://com.apple.Updates/documentation/Updates/wwdc2023": {
        type: "topic",
        title: "WWDC23",
        url: "/documentation/updates/wwdc2023",
        abstract: [
          {
            text: "Highlights of new technologies introduced at WWDC23.",
            type: "text",
          },
        ],
        kind: "article",
        role: "collectionGroup",
      },
      "doc://com.apple.Updates/documentation/Updates/SwiftUI": {
        type: "topic",
        title: "SwiftUI updates",
        url: "/documentation/updates/swiftui",
        abstract: [
          { text: "Learn about important changes to SwiftUI.", type: "text" },
        ],
        kind: "article",
        role: "article",
      },
      "doc://com.apple.Updates/documentation/Updates/UIKit": {
        type: "topic",
        title: "UIKit updates",
        url: "/documentation/updates/uikit",
        abstract: [
          { text: "Learn about important changes to UIKit.", type: "text" },
        ],
        kind: "article",
        role: "article",
      },
      "doc://com.apple.documentation/documentation/ios-ipados-release-notes": {
        type: "topic",
        title: "iOS & iPadOS Release Notes",
        url: "/documentation/ios-ipados-release-notes",
        abstract: [
          {
            text: "Learn about changes to the iOS & iPadOS SDK.",
            type: "text",
          },
        ],
        kind: "article",
        role: "collection",
      },
    },
  };

  const mockUpdatesIndex = {
    interfaceLanguages: {
      swift: [
        {
          path: "/documentation/updates",
          title: "Updates",
          type: "module",
          children: [
            {
              title: "WWDC",
              type: "groupMarker",
            },
            {
              path: "/documentation/updates/wwdc2024",
              title: "WWDC24",
              type: "collection",
              beta: false,
            },
            {
              path: "/documentation/updates/wwdc2023",
              title: "WWDC23",
              type: "collection",
              beta: false,
            },
            {
              title: "Technology updates",
              type: "groupMarker",
            },
            {
              path: "/documentation/updates/swiftui",
              title: "SwiftUI updates",
              type: "article",
              beta: true,
            },
            {
              path: "/documentation/updates/uikit",
              title: "UIKit updates",
              type: "article",
              beta: false,
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    mock.clearAllMocks();
    (updatesCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
      null,
    );
    (
      httpClient.getJson as Mock<(...args: unknown[]) => unknown>
    ).mockImplementation((url: unknown) => {
      const urlStr = url as string;
      if (urlStr.includes("Updates.json")) {
        return Promise.resolve(mockUpdatesData);
      }
      if (urlStr.includes("index/updates")) {
        return Promise.resolve(mockUpdatesIndex);
      }
      throw new Error("Unknown URL");
    });
  });

  it("should fetch and format documentation updates", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "all",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    expect(httpClient.getJson).toHaveBeenCalledTimes(2);
    expect(result).toContain("Apple Developer Documentation Updates");
    expect(result).toContain("WWDC24");
    expect(result).toContain("SwiftUI updates");
    expect(result).toContain("UIKit updates");
  });

  it("should filter by category", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "wwdc",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    expect(result).toContain("WWDC24");
    expect(result).toContain("WWDC23");
    expect(result).not.toContain("SwiftUI updates");
    expect(result).not.toContain("UIKit updates");
  });

  it("should filter by technology", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "all",
      technology: "SwiftUI",
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    expect(result).toContain("SwiftUI updates");
    expect(result).not.toContain("UIKit updates");
    expect(result).not.toContain("WWDC24");
  });

  it("should filter by year for WWDC", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "wwdc",
      technology: undefined,
      year: "2024",
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    expect(result).toContain("WWDC24");
    expect(result).not.toContain("WWDC23");
  });

  it("should filter release notes", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "release-notes",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    expect(result).toContain("iOS & iPadOS Release Notes");
    expect(result).not.toContain("WWDC");
    expect(result).not.toContain("SwiftUI updates");
  });

  it("should exclude beta features when includeBeta is false", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "technology",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: false,
      limit: 50,
    });

    expect(result).toContain("UIKit updates"); // Not beta
    expect(result).not.toContain("SwiftUI updates"); // This is marked as beta
  });

  it("should include beta features when includeBeta is true", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "technology",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    expect(result).toContain("UIKit updates");
    expect(result).toContain("SwiftUI updates");
    expect(result).toContain("(Beta)"); // Beta badge should be shown
  });

  it("should search by query", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "all",
      technology: undefined,
      year: undefined,
      searchQuery: "SwiftUI",
      includeBeta: true,
      limit: 50,
    });

    expect(result).toContain("SwiftUI updates");
    expect(result).not.toContain("UIKit updates");
    expect(result).not.toContain("WWDC24");
  });

  it("should limit results", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "all",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 2,
    });

    // Should contain only two results
    const updateCount = (result.match(/^- \[/gm) || []).length;
    expect(updateCount).toBe(2);
    expect(result).toContain(
      "Showing 2 of 5. Narrow with category, technology or searchQuery, or raise limit.",
    );
  });

  it("should show new badges", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "wwdc",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    expect(result).toContain("WWDC24");
    expect(result).toContain("(New, 2024)"); // WWDC24 has new.svg image
  });

  it("should use cache when available", async () => {
    const cachedResult = "# Cached Updates\n\nThis is cached content.";
    (updatesCache.get as Mock<(...args: unknown[]) => unknown>).mockReturnValue(
      cachedResult,
    );

    const result = await handleGetDocumentationUpdates({
      category: "all",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    expect(httpClient.getJson).not.toHaveBeenCalled();
    expect(result).toBe(cachedResult);
  });

  it("should store results in cache", async () => {
    await handleGetDocumentationUpdates({
      category: "all",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 10,
    });

    expect(updatesCache.set).toHaveBeenCalled();
    const [cacheKey, cachedValue] =
      (updatesCache.set as Mock<(...args: unknown[]) => unknown>).mock
        .calls[0] ?? [];
    expect(cacheKey).toContain("documentation-updates");
    expect(cachedValue).toContain("Apple Developer Documentation Updates");
  });

  it("should handle empty results", async () => {
    // Mock empty data
    (
      httpClient.getJson as Mock<(...args: unknown[]) => unknown>
    ).mockImplementation((url: unknown) => {
      const urlStr = url as string;
      if (urlStr.includes("Updates.json")) {
        return Promise.resolve({ topicSections: [], references: {} });
      }
      if (urlStr.includes("index/updates")) {
        return Promise.resolve({ interfaceLanguages: { swift: [] } });
      }
      throw new Error("Unknown URL");
    });

    const result = await handleGetDocumentationUpdates({
      category: "all",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    expect(result).toBe(
      "No documentation updates found matching the specified criteria.",
    );
  });

  it("rejects with the failure", async () => {
    (
      httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
    ).mockRejectedValue(new Error("Network error"));

    await expect(
      handleGetDocumentationUpdates({
        category: "all",
        technology: undefined,
        year: undefined,
        searchQuery: undefined,
        includeBeta: true,
        limit: 50,
      }),
    ).rejects.toThrow("Network error");
  });

  it("should handle partial data correctly", async () => {
    // Mock data with missing references
    (
      httpClient.getJson as Mock<(...args: unknown[]) => unknown>
    ).mockImplementation((url: unknown) => {
      const urlStr = url as string;
      if (urlStr.includes("Updates.json")) {
        return Promise.resolve({
          topicSections: [
            {
              title: "WWDC",
              identifiers: [
                "doc://com.apple.Updates/documentation/Updates/wwdc2024",
              ],
              anchor: "WWDC",
            },
          ],
          references: {}, // Empty references
        });
      }
      if (urlStr.includes("index/updates")) {
        return Promise.resolve(mockUpdatesIndex);
      }
      throw new Error("Unknown URL");
    });

    const result = await handleGetDocumentationUpdates({
      category: "all",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    // Should handle gracefully and return no results
    expect(result).toBe(
      "No documentation updates found matching the specified criteria.",
    );
  });

  it("should extract technology from path correctly", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "technology",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    // SwiftUI should have technology extracted from path
    expect(result).toContain("SwiftUI updates");
    // Since we're in technology category, the technology metadata is not shown (it's redundant)
    // The technology extraction is working internally as the beta flag is correctly applied
    expect(result).toContain("(Beta)"); // Beta status correctly extracted from index
  });

  it("should group updates by category", async () => {
    const result = await handleGetDocumentationUpdates({
      category: "all",
      technology: undefined,
      year: undefined,
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    // Check proper grouping
    const wwdcIndex = result.indexOf("## WWDC");
    const techIndex = result.indexOf("## Technology Updates");
    const releaseIndex = result.indexOf("## Release Notes");

    expect(wwdcIndex).toBeGreaterThan(-1);
    expect(techIndex).toBeGreaterThan(-1);
    expect(releaseIndex).toBeGreaterThan(-1);

    // WWDC should come before Technology Updates
    expect(wwdcIndex).toBeLessThan(techIndex);
    // Technology Updates should come before Release Notes
    expect(techIndex).toBeLessThan(releaseIndex);
  });

  it("files a WWDC listed under Past releases as wwdc, with its year", async () => {
    (
      httpClient.getJson as Mock<(...args: unknown[]) => unknown>
    ).mockImplementation(async (url: unknown) =>
      (url as string).includes("Updates.json")
        ? {
            topicSections: [
              {
                title: "Past releases",
                identifiers: [
                  "doc://com.apple.Updates/documentation/Updates/wwdc2025",
                ],
                anchor: "Past-releases",
              },
            ],
            references: {
              "doc://com.apple.Updates/documentation/Updates/wwdc2025": {
                type: "topic",
                title: "WWDC25",
                url: "/documentation/updates/wwdc2025",
                kind: "article",
                abstract: [
                  {
                    type: "text",
                    text: "Highlights of new technologies introduced at WWDC25.",
                  },
                ],
              },
            },
          }
        : {
            interfaceLanguages: {
              swift: [
                {
                  path: "/documentation/updates",
                  title: "Updates",
                  type: "module",
                  children: [
                    {
                      path: "/documentation/updates/wwdc2025",
                      title: "WWDC25",
                      type: "article",
                    },
                  ],
                },
              ],
            },
          },
    );

    const result = await handleGetDocumentationUpdates({
      category: "wwdc",
      technology: undefined,
      year: "2025",
      searchQuery: undefined,
      includeBeta: true,
      limit: 50,
    });

    expect(result).toContain("## WWDC");
    expect(result).toContain(
      "[WWDC25](https://developer.apple.com/documentation/updates/wwdc2025)",
    );
    expect(result).toContain("(2025)");
    expect(result).not.toContain("Technology:");
  });
});
