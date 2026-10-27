/**
 * Apple's Technology Overviews, read from its navigator index: groups of collections, each with its own articles.
 */
import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";
import { technologyOverviewsCache } from "../../src/core/cache.ts";
import { httpClient } from "../../src/core/http-client.ts";
import { handleGetTechnologyOverviews } from "../../src/docs/get-technology-overviews.ts";
import { httpClientModule } from "../mocks/http-client.mock.ts";

mock.module("../../src/core/http-client.ts", httpClientModule);
mock.module("../../src/core/cache.ts", () => ({
  technologyOverviewsCache: {
    get: mock(),
    set: mock(),
  },
  generateUrlCacheKey: mock(
    (key, params) => `${key}-${JSON.stringify(params)}`,
  ),
}));

const PATH = "/documentation/technologyoverviews";
const reference = (slug: string, title: string, abstract: string) => ({
  type: "topic",
  kind: "article",
  role: "collectionGroup",
  title,
  url: `${PATH}/${slug}`,
  abstract: [{ type: "text", text: abstract }],
});

// Trimmed from Apple's TechnologyOverviews.json and index/technologyoverviews (2026-10-06)
const overviewsData = {
  topicSections: [
    {
      title: "Get started",
      identifiers: ["doc://TO/app-design-and-ui", "doc://TO/games"],
      anchor: "Get-started",
    },
    {
      title: "Discover Apple technologies",
      identifiers: ["doc://TO/data-management"],
      anchor: "Discover-Apple-technologies",
    },
  ],
  references: {
    "doc://TO/app-design-and-ui": reference(
      "app-design-and-ui",
      "App design and UI",
      "Build your app’s interface.",
    ),
    "doc://TO/games": reference("games", "Games", "Deliver game experiences."),
    "doc://TO/data-management": reference(
      "data-management",
      "Data management",
      "Persist your data.",
    ),
  },
};

const overviewsIndex = {
  interfaceLanguages: {
    swift: [
      {
        type: "module",
        title: "Technology Overviews",
        path: PATH,
        children: [
          { type: "groupMarker", title: "Get started" },
          {
            type: "collection",
            title: "App design and UI",
            path: `${PATH}/app-design-and-ui`,
            children: [
              { type: "groupMarker", title: "App builder" },
              {
                type: "article",
                title: "SwiftUI apps",
                path: `${PATH}/swiftui`,
              },
              {
                type: "article",
                title: "UIKit and AppKit apps",
                path: `${PATH}/uikit-appkit`,
              },
              { type: "groupMarker", title: "Interface" },
              {
                type: "collection",
                title: "Liquid Glass",
                path: `${PATH}/liquid-glass`,
                children: [
                  { type: "groupMarker", title: "Essentials" },
                  {
                    type: "article",
                    title: "Adopting Liquid Glass",
                    path: `${PATH}/adopting-liquid-glass`,
                  },
                ],
              },
            ],
          },
          {
            type: "collection",
            title: "Games",
            path: `${PATH}/games`,
            children: [
              { type: "groupMarker", title: "Porting" },
              {
                type: "article",
                title: "Building your macOS game remotely from your PC",
                path: `${PATH}/building-your-macos-game-remotely-from-your-pc`,
              },
            ],
          },
          { type: "groupMarker", title: "Discover Apple technologies" },
          {
            type: "collection",
            title: "Data management",
            path: `${PATH}/data-management`,
            children: [
              { type: "groupMarker", title: "Persistence and sharing" },
              {
                type: "article",
                title: "Shared data",
                path: `${PATH}/shared-data`,
              },
            ],
          },
        ],
      },
    ],
  },
};

const links = (result: string): string[] =>
  [
    ...result.matchAll(/\[([^\]]+)\]\(\/documentation\/technologyoverviews\//g),
  ].map((match) => match[1] ?? "");

describe("get-technology-overviews", () => {
  beforeEach(() => {
    mock.clearAllMocks();
    (
      technologyOverviewsCache.get as Mock<(...args: unknown[]) => unknown>
    ).mockReturnValue(null);
    (
      httpClient.getJson as Mock<(...args: unknown[]) => unknown>
    ).mockImplementation((url: unknown) => {
      const urlStr = url as string;
      if (urlStr.includes("TechnologyOverviews.json")) {
        return Promise.resolve(overviewsData);
      }
      if (urlStr.includes("index/technologyoverviews")) {
        return Promise.resolve(overviewsIndex);
      }
      throw new Error("Unknown URL");
    });
  });

  it("lists each group, its collections with their summaries, and every article under its own collection", async () => {
    const result = await handleGetTechnologyOverviews({
      category: undefined,
      searchQuery: undefined,
      includeSubcategories: true,
      limit: 50,
    });

    expect(links(result)).toEqual([
      "App design and UI",
      "SwiftUI apps",
      "UIKit and AppKit apps",
      "Liquid Glass",
      "Adopting Liquid Glass",
      "Games",
      "Building your macOS game remotely from your PC",
      "Data management",
      "Shared data",
    ]);
    const order = [
      "## Get started",
      "- [App design and UI]",
      "Build your app’s interface.",
      "**App builder**",
      "[SwiftUI apps]",
      "**Interface**",
      "[Liquid Glass]",
      "**Essentials**",
      "[Adopting Liquid Glass]",
      "- [Games]",
      "## Discover Apple technologies",
      "- [Data management]",
      "[Shared data]",
    ].map((text) => result.indexOf(text));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("gives a category with all its articles, those of its nested collections included", async () => {
    const result = await handleGetTechnologyOverviews({
      category: "app-design-and-ui",
      searchQuery: undefined,
      includeSubcategories: true,
      limit: 50,
    });
    const nested = await handleGetTechnologyOverviews({
      category: "liquid-glass",
      searchQuery: undefined,
      includeSubcategories: true,
      limit: 50,
    });

    expect(links(result)).toEqual([
      "App design and UI",
      "SwiftUI apps",
      "UIKit and AppKit apps",
      "Liquid Glass",
      "Adopting Liquid Glass",
    ]);
    expect(links(nested)).toEqual(["Liquid Glass", "Adopting Liquid Glass"]);
  });

  it("counts every entry it prints against the limit", async () => {
    const result = await handleGetTechnologyOverviews({
      category: undefined,
      searchQuery: undefined,
      includeSubcategories: true,
      limit: 3,
    });

    expect(links(result)).toEqual([
      "App design and UI",
      "SwiftUI apps",
      "UIKit and AppKit apps",
    ]);
    expect(result).toContain(
      "Showing 3 of 9. Narrow with category or searchQuery, or raise limit.",
    );
  });

  it("does not mention a cap when everything fits", async () => {
    const result = await handleGetTechnologyOverviews({
      category: undefined,
      searchQuery: undefined,
      includeSubcategories: true,
      limit: 50,
    });

    expect(result).not.toContain("Showing");
    expect(result).not.toContain("###");
  });

  it("lists only the collections without subcategories", async () => {
    const result = await handleGetTechnologyOverviews({
      category: undefined,
      searchQuery: undefined,
      includeSubcategories: false,
      limit: 50,
    });

    expect(links(result)).toEqual([
      "App design and UI",
      "Liquid Glass",
      "Games",
      "Data management",
    ]);
  });

  it("finds entries by title or summary, naming the collection each is in", async () => {
    const result = await handleGetTechnologyOverviews({
      category: undefined,
      searchQuery: "liquid",
      includeSubcategories: true,
      limit: 50,
    });

    expect(links(result)).toEqual(["Liquid Glass", "Adopting Liquid Glass"]);
    expect(result).toContain(
      "[Adopting Liquid Glass](/documentation/technologyoverviews/adopting-liquid-glass) *(Article)* — in Liquid Glass",
    );
  });

  it("names the categories when the one asked for does not exist", async () => {
    const result = await handleGetTechnologyOverviews({
      category: "nope",
      searchQuery: undefined,
      includeSubcategories: true,
      limit: 50,
    });

    expect(result).toBe(
      'No technology overview matches category "nope". Categories: app-design-and-ui, liquid-glass, games, data-management.',
    );
  });

  it("uses the cached answer when there is one", async () => {
    (
      technologyOverviewsCache.get as Mock<(...args: unknown[]) => unknown>
    ).mockReturnValue("cached");

    await expect(
      handleGetTechnologyOverviews({
        category: undefined,
        searchQuery: undefined,
        includeSubcategories: true,
        limit: 50,
      }),
    ).resolves.toBe("cached");
    expect(httpClient.getJson).not.toHaveBeenCalled();
  });

  it("caches its answer", async () => {
    const result = await handleGetTechnologyOverviews({
      category: undefined,
      searchQuery: undefined,
      includeSubcategories: true,
      limit: 50,
    });

    expect(technologyOverviewsCache.set).toHaveBeenCalledWith(
      expect.stringContaining("technology-overviews"),
      result,
    );
  });

  it("says so when Apple lists nothing", async () => {
    (
      httpClient.getJson as Mock<(...args: unknown[]) => unknown>
    ).mockImplementation((url: unknown) =>
      Promise.resolve(
        (url as string).includes("TechnologyOverviews.json")
          ? { topicSections: [], references: {} }
          : { interfaceLanguages: { swift: [] } },
      ),
    );

    await expect(
      handleGetTechnologyOverviews({
        category: undefined,
        searchQuery: undefined,
        includeSubcategories: true,
        limit: 50,
      }),
    ).resolves.toBe(
      "No technology overviews found matching the specified criteria.",
    );
  });

  it("reports a failed request", async () => {
    (
      httpClient.getJson as Mock<(...args: unknown[]) => Promise<unknown>>
    ).mockRejectedValue(new Error("Network error"));

    await expect(
      handleGetTechnologyOverviews({
        category: undefined,
        searchQuery: undefined,
        includeSubcategories: true,
        limit: 50,
      }),
    ).rejects.toThrow("Network error");
  });
});
