import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";
import * as cacheActual from "../../src/core/cache.ts";
import { APPLE_URLS } from "../../src/core/constants.ts";

describe("handleGetSampleCode", () => {
  let mockHttpClient: {
    get: Mock<(url: string) => Promise<unknown>>;
    getJson: Mock<(url: string) => Promise<unknown>>;
  };
  let mockSampleCodeCache: {
    get: Mock<(key: string) => unknown>;
    set: Mock<(key: string, value: unknown) => void>;
  };
  let mockGenerateUrlCacheKey: Mock<(...args: unknown[]) => unknown>;

  // Sample data
  const mockSampleCodeContent = {
    metadata: {
      role: "collection",
      title: "Sample Code Library",
    },
    abstract: [
      {
        type: "text",
        text: "Enhance and expand your knowledge of Apple technologies by exploring the full library of sample code projects.",
      },
    ],
    primaryContentSections: [
      {
        kind: "content",
        content: [
          {
            type: "heading",
            text: "Featured at WWDC25",
            anchor: "Featured-at-WWDC25",
            level: 2,
          },
          {
            type: "links",
            items: [
              "doc://com.apple.documentation/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass",
              "doc://com.apple.documentation/documentation/StoreKit/understanding-storekit-workflows",
            ],
            style: "detailedGrid",
          },
        ],
      },
    ],
    topicSections: [
      {
        anchor: "WWDC25",
        title: "WWDC25",
        identifiers: [
          "doc://com.apple.documentation/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass",
          "doc://com.apple.documentation/documentation/StoreKit/understanding-storekit-workflows",
          "doc://com.apple.documentation/documentation/FoundationModels/adding-intelligent-app-features-with-generative-models",
        ],
      },
      {
        anchor: "SwiftUI",
        title: "SwiftUI",
        identifiers: [
          "doc://com.apple.documentation/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass",
          "doc://com.apple.documentation/documentation/SwiftUI/building-rich-swiftui-text-experiences",
        ],
      },
    ],
  };

  const mockSampleCodeIndex = {
    interfaceLanguages: {
      swift: [
        {
          path: "/documentation/samplecode",
          title: "Sample Code Library",
          type: "module",
          children: [
            {
              title: "WWDC25",
              type: "groupMarker",
            },
            {
              path: "/documentation/foundationmodels/adding-intelligent-app-features-with-generative-models",
              title: "Adding intelligent app features with generative models",
              type: "sampleCode",
              external: true,
              beta: true,
            },
            {
              path: "/documentation/storekit/understanding-storekit-workflows",
              title: "Understanding StoreKit workflows",
              type: "sampleCode",
              external: true,
              beta: false,
            },
            {
              title: "SwiftUI",
              type: "groupMarker",
            },
            {
              path: "/documentation/swiftui/landmarks-building-an-app-with-liquid-glass",
              title: "Landmarks: Building an app with Liquid Glass",
              type: "sampleCode",
              external: true,
              beta: false,
            },
            {
              path: "/documentation/swiftui/building-rich-swiftui-text-experiences",
              title: "Building rich SwiftUI text experiences",
              type: "sampleCode",
              external: true,
              beta: true,
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    mock.clearAllMocks();

    // Setup HTTP client mock
    mockHttpClient = {
      get: mock(),
      // The technologies index, whose names the samples' frameworks take: empty here, so their paths decide
      getJson: mock().mockResolvedValue({ sections: [] }),
    };
    mock.module("../../src/core/http-client.ts", () => ({
      httpClient: mockHttpClient,
    }));

    // Setup cache mock
    mockSampleCodeCache = {
      get: mock().mockReturnValue(null),
      set: mock(),
    };
    mockGenerateUrlCacheKey = mock().mockImplementation((prefix, params) => {
      return `${prefix}:${JSON.stringify(params)}`;
    });
    mock.module("../../src/core/cache.ts", () => ({
      ...cacheActual,
      sampleCodeCache: mockSampleCodeCache,
      generateUrlCacheKey: mockGenerateUrlCacheKey,
    }));
  });

  it("should fetch and return sample code data", async () => {
    // Mock HTTP responses
    mockHttpClient.get
      .mockResolvedValueOnce({
        ok: true,
        json: mock().mockResolvedValue(mockSampleCodeContent),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: mock().mockResolvedValue(mockSampleCodeIndex),
      });

    // Re-import to get mocked version
    const { handleGetSampleCode } = await import(
      "../../src/docs/get-sample-code.ts"
    );
    const result = await handleGetSampleCode({
      framework: undefined,
      beta: "include",
      searchQuery: undefined,
      limit: 50,
    });

    // Verify API calls
    expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
    expect(mockHttpClient.get).toHaveBeenCalledWith(
      APPLE_URLS.SAMPLE_CODE_JSON,
    );
    expect(mockHttpClient.get).toHaveBeenCalledWith(
      APPLE_URLS.SAMPLE_CODE_INDEX_JSON,
    );

    // Verify result contains expected content
    expect(result).toContain("Apple Sample Code Library");
    expect(result).toContain("4 sample code projects");
    expect(result).toContain("Landmarks: Building an app with Liquid Glass");
    expect(result).toContain("Understanding StoreKit workflows");

    expect(result).not.toContain("Showing");
  });

  it("should filter by framework", async () => {
    mockHttpClient.get
      .mockResolvedValueOnce({
        ok: true,
        json: mock().mockResolvedValue(mockSampleCodeContent),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: mock().mockResolvedValue(mockSampleCodeIndex),
      });

    const { handleGetSampleCode } = await import(
      "../../src/docs/get-sample-code.ts"
    );
    const result = await handleGetSampleCode({
      framework: "SwiftUI",
      beta: "include",
      searchQuery: undefined,
      limit: 50,
    });

    expect(result).not.toContain("Framework:");
    expect(result).toContain("2 sample code projects");
    expect(result).toContain("## SwiftUI");
    expect(result).not.toContain("Understanding StoreKit workflows");
  });

  it("should filter beta samples when beta=exclude", async () => {
    mockHttpClient.get
      .mockResolvedValueOnce({
        ok: true,
        json: mock().mockResolvedValue(mockSampleCodeContent),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: mock().mockResolvedValue(mockSampleCodeIndex),
      });

    const { handleGetSampleCode } = await import(
      "../../src/docs/get-sample-code.ts"
    );
    const result = await handleGetSampleCode({
      framework: undefined,
      beta: "exclude",
      searchQuery: undefined,
      limit: 50,
    });

    expect(result).not.toContain("Beta: exclude");
    expect(result).toContain("2 sample code projects");
    expect(result).not.toContain("Adding intelligent app features");
    expect(result).not.toContain("Building rich SwiftUI text experiences");
    expect(result).toContain("Understanding StoreKit workflows");
    expect(result).toContain("Landmarks: Building an app with Liquid Glass");
  });

  it("says how many are not shown when limit cuts the list", async () => {
    mockHttpClient.get
      .mockResolvedValueOnce({
        ok: true,
        json: mock().mockResolvedValue(mockSampleCodeContent),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: mock().mockResolvedValue(mockSampleCodeIndex),
      });

    const { handleGetSampleCode } = await import(
      "../../src/docs/get-sample-code.ts"
    );
    const result = await handleGetSampleCode({
      framework: undefined,
      beta: "include",
      searchQuery: undefined,
      limit: 1,
    });

    expect(result).toContain("4 sample code projects");
    expect(result).toContain(
      "Showing 1 of 4. Narrow with searchQuery or framework, or raise limit.",
    );
  });

  it("should return cached results when available", async () => {
    const cachedResult = "# Cached Sample Code Data";
    mockSampleCodeCache.get.mockReturnValue(cachedResult);

    const { handleGetSampleCode } = await import(
      "../../src/docs/get-sample-code.ts"
    );
    const result = await handleGetSampleCode({
      framework: undefined,
      beta: "include",
      searchQuery: undefined,
      limit: 50,
    });

    expect(result).toBe(cachedResult);
    expect(mockHttpClient.get).not.toHaveBeenCalled();
  });

  it("should cache results after fetching", async () => {
    mockHttpClient.get
      .mockResolvedValueOnce({
        ok: true,
        json: mock().mockResolvedValue(mockSampleCodeContent),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: mock().mockResolvedValue(mockSampleCodeIndex),
      });

    const { handleGetSampleCode } = await import(
      "../../src/docs/get-sample-code.ts"
    );
    await handleGetSampleCode({
      framework: "SwiftUI",
      beta: "exclude",
      searchQuery: "test",
      limit: 10,
    });

    expect(mockSampleCodeCache.set).toHaveBeenCalled();
    expect(mockGenerateUrlCacheKey).toHaveBeenCalledWith("sample-code", {
      framework: "SwiftUI",
      beta: "exclude",
      searchQuery: "test",
      limit: 10,
    });
  });

  it("should handle API errors gracefully", async () => {
    mockHttpClient.get.mockRejectedValueOnce(new Error("Network error"));

    const { handleGetSampleCode } = await import(
      "../../src/docs/get-sample-code.ts"
    );
    await expect(
      handleGetSampleCode({
        framework: undefined,
        beta: "include",
        searchQuery: undefined,
        limit: 50,
      }),
    ).rejects.toThrow("Network error");
  });

  it("should handle non-200 status codes", async () => {
    mockHttpClient.get.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
    });

    const { handleGetSampleCode } = await import(
      "../../src/docs/get-sample-code.ts"
    );
    await expect(
      handleGetSampleCode({
        framework: undefined,
        beta: "include",
        searchQuery: undefined,
        limit: 50,
      }),
    ).rejects.toThrow("Failed to fetch sample code content: Not Found");
  });
});
