/**
 * Response format validation tests
 *
 * Every tool answers over MCP with one text content item: the use case's Markdown, or one error result.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
} from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

// Mock wwdc-data-source before importing anything that uses it
mock.module("../src/wwdc/data-source.ts", () => ({
  loadGlobalMetadata: mock(),
  loadTopicIndex: mock(),
  loadYearIndex: mock(),
  loadVideoData: mock(),
  loadAllVideos: mock(),
  clearDataCache: mock(),
}));

type ToolResponse = {
  content: { type: string; text: string }[];
  isError?: boolean;
};

// Mock external dependencies
mock.module("../src/core/http-client.ts", () => ({
  httpClient: {
    getText: mock().mockResolvedValue(
      '<html><body><ul class="search-results"></ul></body></html>',
    ),
    postText: mock().mockResolvedValue(""),
    get: mock().mockResolvedValue({
      ok: true,
      json: mock().mockResolvedValue({}),
    }),
  },
}));

mock.module("../src/core/logger.ts", () => ({
  logger: {
    info: mock(),
    error: mock(),
    warn: mock(),
    debug: mock(),
  },
}));

const cacheActual = await import("../src/core/cache.ts");
mock.module("../src/core/cache.ts", () => ({
  ...cacheActual,
  apiCache: {
    get: mock().mockReturnValue(null),
    set: mock(),
    has: mock().mockReturnValue(false),
  },
  generateUrlCacheKey: mock().mockReturnValue("test-cache-key"),
}));

/**
 * Replaces some exports of a module, keeping the others real. The use cases that are not under test answer with a
 * fixed text; search and the page reader keep the real code, which the tests reach through the mocked HTTP client.
 */
async function replaceExports(
  path: string,
  overrides: Record<string, unknown>,
): Promise<void> {
  const actual = await import(path);
  mock.module(path, () => ({ ...actual, ...overrides }));
}

const { fetchAppleDocJson: actualFetchAppleDocJson } = await import(
  "../src/docs/doc-fetcher.ts"
);
// Defaults to the real reader, so an invalid URL is refused before any request; tests that need a page replace it
const fetchAppleDocJson = mock(actualFetchAppleDocJson);

await replaceExports("../src/docs/doc-fetcher.ts", { fetchAppleDocJson });
await replaceExports("../src/docs/list-technologies.ts", {
  handleListTechnologies: mock(async () => "Mock technologies list"),
});
await replaceExports("../src/docs/search-framework-symbols.ts", {
  searchFrameworkSymbols: mock(async () => "Mock framework symbols"),
});
await replaceExports("../src/docs/get-related-apis.ts", {
  handleGetRelatedApis: mock(async () => "Mock related APIs"),
});
await replaceExports("../src/docs/resolve-references-batch.ts", {
  handleResolveReferencesBatch: mock(async () => "Mock references"),
});
await replaceExports("../src/docs/get-platform-compatibility.ts", {
  handleGetPlatformCompatibility: mock(
    async () => "Mock platform compatibility",
  ),
});
await replaceExports("../src/docs/find-similar-apis.ts", {
  handleFindSimilarApis: mock(async () => "Mock similar APIs"),
});
await replaceExports("../src/docs/get-documentation-updates.ts", {
  handleGetDocumentationUpdates: mock(async () => "Mock documentation updates"),
});
await replaceExports("../src/docs/get-technology-overviews.ts", {
  handleGetTechnologyOverviews: mock(async () => "Mock technology overviews"),
});
await replaceExports("../src/docs/get-sample-code.ts", {
  handleGetSampleCode: mock(async () => "Mock sample code"),
});

const { createServer } = await import("../src/server.ts");

describe("Response Format Validation", () => {
  let client: Client;

  const call = async (
    name: string,
    args: Record<string, unknown>,
  ): Promise<ToolResponse> =>
    (await client.callTool({ name, arguments: args })) as ToolResponse;

  /**
   * Valid MCP response format: { content: [{ type: 'text', text: string }], isError?: boolean }, with one item.
   */
  const validateResponseFormat = (response: ToolResponse) => {
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content).toHaveLength(1);

    response.content.forEach((item) => {
      expect(item.type).toBe("text");
      expect(typeof item.text).toBe("string");
    });
  };

  beforeEach(async () => {
    mock.clearAllMocks();
    fetchAppleDocJson.mockImplementation(actualFetchAppleDocJson);

    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test", version: "test" });
    await Promise.all([
      createServer().connect(serverSide),
      client.connect(clientSide),
    ]);
  });

  afterEach(async () => {
    await client.close();
  });

  describe("search_apple_docs response format", () => {
    it("should return properly formatted response for valid query", async () => {
      const response = await call("search_apple_docs", { query: "SwiftUI" });

      validateResponseFormat(response);
      expect(response.content[0]?.text).toContain(
        "Apple Documentation Search Results",
      );
    });

    it("should ask for WWDC sessions separately under all, and list them after the documentation", async () => {
      const { httpClient } = await import("../src/core/http-client.ts");
      const post = httpClient.postText as Mock<typeof httpClient.postText>;
      const stream = (results: unknown[]) =>
        JSON.stringify({
          kind: "search",
          diff: { append: JSON.stringify({ results }) },
        });
      post.mockReset();
      post
        .mockResolvedValueOnce(
          stream([
            {
              value: {
                metadata: {
                  title: "SKTestSession",
                  kind: "symbol",
                  permalink:
                    "https://developer.apple.com/documentation/storekittest/sktestsession",
                },
              },
            },
          ]) as never,
        )
        .mockResolvedValueOnce(
          stream([
            {
              value: {
                metadata: {
                  ids: ["wwdc2020-10659"],
                  titles: ["Introducing StoreKit Testing in Xcode"],
                  itemTypes: ["Video"],
                  permalinks: [
                    "https://developer.apple.com/videos/play/wwdc2020/10659",
                  ],
                },
              },
            },
          ]) as never,
        );

      const text =
        (
          await call("search_apple_docs", {
            query: "StoreKit testing",
            type: "all",
          })
        ).content[0]?.text ?? "";

      // The search developer.apple.com/search sends unfiltered; then the videos on their own
      expect(post.mock.calls[0]?.[1]).not.toHaveProperty("searchScope");
      const firstBody = post.mock.calls[0]?.[1] as {
        includedResponses: string[];
      };
      expect(firstBody.includedResponses).toEqual(["search"]);
      expect(JSON.stringify(post.mock.calls[1]?.[1])).toContain(
        "/videos/play/",
      );
      expect(text).toContain("SKTestSession");
      expect(text).toContain('get_wwdc_video (year: "2020", videoId: "10659")');
      expect(text.indexOf("SKTestSession")).toBeLessThan(
        text.indexOf("Introducing StoreKit Testing"),
      );
      post.mockReset();
      post.mockResolvedValue("" as never);
    });

    it("should make one request under the other filters", async () => {
      const { httpClient } = await import("../src/core/http-client.ts");
      const post = httpClient.postText as Mock<typeof httpClient.postText>;
      post.mockClear();

      await call("search_apple_docs", {
        query: "StoreKit testing",
        type: "documentation",
      });

      expect(post).toHaveBeenCalledTimes(1);
    });

    it("should return properly formatted error response for invalid input", async () => {
      const response = await call("search_apple_docs", { query: "" });

      validateResponseFormat(response);
      expect(response.isError).toBe(true);
      expect(response.content[0]?.text).toContain("Error:");
    });
  });

  describe("All MCP tools response format consistency", () => {
    const toolTests = [
      { name: "list_technologies", args: {} },
      {
        name: "search_framework_symbols",
        args: { framework: "SwiftUI" },
      },
      {
        name: "get_apple_doc_content",
        args: { url: "https://developer.apple.com/documentation/swiftui" },
      },
      {
        name: "get_related_apis",
        args: {
          apiUrl: "https://developer.apple.com/documentation/swiftui/view",
        },
      },
      {
        name: "resolve_references_batch",
        args: {
          sourceUrl: "https://developer.apple.com/documentation/swiftui",
        },
      },
      {
        name: "get_platform_compatibility",
        args: {
          apiUrl: "https://developer.apple.com/documentation/swiftui/view",
        },
      },
      {
        name: "find_similar_apis",
        args: {
          apiUrl: "https://developer.apple.com/documentation/swiftui/view",
        },
      },
      { name: "get_documentation_updates", args: {} },
      { name: "get_technology_overviews", args: {} },
      { name: "get_sample_code", args: {} },
    ];

    describe("each tool answers with one text item", () => {
      beforeEach(() => {
        fetchAppleDocJson.mockResolvedValue("Mock doc content");
      });

      toolTests.forEach(({ name, args }) => {
        it(`${name} should return properly formatted response`, async () => {
          const response = await call(name, args);

          validateResponseFormat(response);
          expect(typeof response.content[0]?.text).toBe("string");
        });
      });
    });
  });

  describe("Error response format consistency", () => {
    it("should maintain consistent error format across all tools", async () => {
      // An invalid URL is refused by the page reader before any request
      const response = await call("get_apple_doc_content", {
        url: "invalid-url",
      });

      validateResponseFormat(response);
      expect(response.isError).toBe(true);
      expect(response.content[0]?.text).toContain("Error:");
    });

    it("should handle network errors with proper format", async () => {
      // Mock network failure
      const { httpClient } = await import("../src/core/http-client.ts");
      (
        httpClient.postText as Mock<typeof httpClient.postText>
      ).mockRejectedValueOnce(new Error("Network error"));

      const response = await call("search_apple_docs", {
        query: "SwiftUI",
        type: "all",
      });

      validateResponseFormat(response);
      expect(response.isError).toBe(true);
    });
  });

  describe("get_apple_doc_content options", () => {
    it("should return the page for enhanced options as one text item", async () => {
      fetchAppleDocJson.mockResolvedValueOnce("Mock doc content");

      const response = await call("get_apple_doc_content", {
        url: "https://developer.apple.com/documentation/swiftui/view",
        includeRelatedApis: true,
        includeReferences: true,
        includeSimilarApis: true,
        includePlatformAnalysis: true,
      });

      validateResponseFormat(response);
      expect(response.content[0]?.text).toContain("Mock doc content");
    });
  });

  describe("Response size and performance validation", () => {
    it("should return reasonable response sizes", async () => {
      const response = await call("search_apple_docs", {
        query: "SwiftUI",
        type: "all",
      });

      validateResponseFormat(response);

      const responseText = response.content[0]?.text ?? "";
      expect(responseText.length).toBeLessThan(50000); // 50KB limit
      expect(responseText.length).toBeGreaterThan(10); // Not empty
    });

    it("should handle large responses gracefully", async () => {
      // Mock a large response
      const largeHtml =
        '<html><body><ul class="search-results">' +
        '<li class="search-result">'.repeat(100) +
        "<article><h1>Test Result</h1><p>Description</p></article></li>".repeat(
          100,
        ) +
        "</ul></body></html>";

      const { httpClient } = await import("../src/core/http-client.ts");
      (
        httpClient.getText as Mock<typeof httpClient.getText>
      ).mockResolvedValueOnce(largeHtml);

      const response = await call("search_apple_docs", {
        query: "SwiftUI",
        type: "all",
      });

      validateResponseFormat(response);
      // Should handle large responses without breaking format
      expect(response.content[0]?.text).toBeDefined();
    });
  });
});
