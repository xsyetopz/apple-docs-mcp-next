import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";
import { httpClient } from "../../src/core/http-client.ts";
import { handleFindSimilarApis } from "../../src/docs/find-similar-apis.ts";
import { convertToJsonApiUrl } from "../../src/docs/url-converter.ts";
import type { Mocked } from "../helpers/test-helpers.ts";
import { httpClientModule } from "../mocks/http-client.mock.ts";

mock.module("../../src/core/http-client.ts", httpClientModule);
mock.module("../../src/docs/url-converter.ts", () => ({
  convertToJsonApiUrl: mock(),
  convertToJsonUrl: mock(),
  isValidAppleDeveloperUrl: mock().mockReturnValue(true),
}));

const mockHttpClient = httpClient as Mocked<typeof httpClient>;
const mockConvertToJsonApiUrl = convertToJsonApiUrl as Mock<
  typeof convertToJsonApiUrl
>;

describe("find-similar-apis", () => {
  beforeEach(() => {
    mock.clearAllMocks();
    mockConvertToJsonApiUrl.mockReturnValue(
      "https://developer.apple.com/documentation/swiftui/text.json",
    );
  });

  describe("handleFindSimilarApis", () => {
    const mockApiUrl = "https://developer.apple.com/documentation/swiftui/text";
    const mockJsonResponse = {
      data: {
        identifier: "swiftui/text",
        title: "Text",
        abstract: [{ type: "text", text: "A view that displays text." }],
        metadata: {
          title: "Text",
          roleHeading: "Structure",
          platforms: [{ name: "iOS", introducedAt: "13.0" }],
        },
        seeAlsoSections: [
          {
            title: "Text Display",
            identifiers: ["swiftui/label", "swiftui/textfield"],
          },
        ],
        topicSections: [
          {
            title: "Creating Text Views",
            identifiers: ["swiftui/text/init", "swiftui/text/init-string"],
          },
        ],
      },
      references: {
        "swiftui/label": {
          type: "topic",
          title: "Label",
          url: "/documentation/swiftui/label",
          abstract: [
            { type: "text", text: "A view that displays text and an icon." },
          ],
        },
        "swiftui/textfield": {
          type: "topic",
          title: "TextField",
          url: "/documentation/swiftui/textfield",
          abstract: [{ type: "text", text: "A control for entering text." }],
        },
        "swiftui/text/init": {
          type: "topic",
          title: "init(_:)",
          url: "/documentation/swiftui/text/init",
        },
        "swiftui/text/init-string": {
          type: "topic",
          title: "init(String)",
          url: "/documentation/swiftui/text/init-string",
        },
      },
    };

    it("should find similar APIs with shallow search depth", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleFindSimilarApis({
        apiUrl: mockApiUrl,
        searchDepth: "shallow",
        filterByCategory: undefined,
        includeAlternatives: true,
        limit: 15,
      });

      expect(mockConvertToJsonApiUrl).toHaveBeenCalledWith(mockApiUrl);
      expect(mockHttpClient.getJson).toHaveBeenCalledTimes(1);

      expect(result).toContain("# Similar APIs to Text");
      expect(result).toContain("Structure · iOS 13.0+");
      expect(result).toContain("## See Also: Text Display");
      expect(result).toContain("- [Label]");
      expect(result).toContain("A view that displays text and an icon.");
      expect(result).toContain("- [TextField]");
      expect(result).toContain("2 similar APIs");
    });

    it("should include topic sections with medium search depth", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleFindSimilarApis({
        apiUrl: mockApiUrl,
        searchDepth: "medium",
        filterByCategory: undefined,
        includeAlternatives: true,
        limit: 15,
      });

      expect(result).toContain("## See Also: Text Display");
      expect(result).toContain("## Topic Group: Creating Text Views");
      expect(result).toContain("- [init(_:)]");
      expect(result).toContain("- [init(String)]");
      expect(result).toContain("4 similar APIs");
    });

    it("should perform deep search with related APIs", async () => {
      const relatedApiResponse = {
        data: {
          identifier: "swiftui/label",
          title: "Label",
          seeAlsoSections: [
            {
              title: "Label Components",
              identifiers: ["swiftui/labelstyle"],
            },
          ],
        },
        references: {
          "swiftui/labelstyle": {
            type: "topic",
            title: "LabelStyle",
            url: "/documentation/swiftui/labelstyle",
            abstract: [{ type: "text", text: "A protocol for label styles." }],
          },
        },
      };

      mockHttpClient.getJson
        .mockResolvedValueOnce(mockJsonResponse)
        .mockResolvedValueOnce(relatedApiResponse);

      mockConvertToJsonApiUrl
        .mockReturnValueOnce(
          "https://developer.apple.com/documentation/swiftui/text.json",
        )
        .mockReturnValueOnce(
          "https://developer.apple.com/documentation/swiftui/label.json",
        );

      const result = await handleFindSimilarApis({
        apiUrl: mockApiUrl,
        searchDepth: "deep",
        filterByCategory: undefined,
        includeAlternatives: true,
        limit: 15,
      });

      // Deep search makes multiple calls (1 initial + up to 3 for related APIs)
      expect(mockHttpClient.getJson.mock.calls.length).toBeGreaterThanOrEqual(
        2,
      );
      expect(result).toContain("## See Also: Text Display");
      expect(result).toContain("- [Label]");
      expect(result).toContain("LabelStyle");
    });

    it("should filter by category", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleFindSimilarApis({
        apiUrl: mockApiUrl,
        searchDepth: "medium",
        filterByCategory: "Creating",
        includeAlternatives: true,
        limit: 15,
      });

      expect(result).toContain("## Topic Group: Creating Text Views");
      expect(result).not.toContain("## See Also: Text Display");
      expect(result).toContain("2 similar APIs");
    });

    it("should exclude alternatives when includeAlternatives is false", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleFindSimilarApis({
        apiUrl: mockApiUrl,
        searchDepth: "medium",
        filterByCategory: undefined,
        includeAlternatives: false,
        limit: 15,
      });

      expect(result).toContain("## See Also: Text Display");
      expect(result).not.toContain("## Topic Group: Creating Text Views");
    });

    it("should cap the total at limit and say how many more there are", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleFindSimilarApis({
        apiUrl: mockApiUrl,
        searchDepth: "medium",
        filterByCategory: undefined,
        includeAlternatives: true,
        limit: 3,
      });

      expect(result).toContain("3 similar APIs");
      expect(result).toContain("…and 1 more");
      expect(result).toContain("Showing 3 of 4. Raise limit");
      expect(result).toContain("- [TextField]");
      expect(result).not.toContain("init(String)");
    });

    it("should count what the depth leaves out", async () => {
      const ids = Array.from({ length: 7 }, (_, i) => `swiftui/view${i}`);
      mockHttpClient.getJson.mockResolvedValue({
        data: {
          ...mockJsonResponse.data,
          seeAlsoSections: [{ title: "Views", identifiers: ids }],
          topicSections: [],
        },
        references: Object.fromEntries(
          ids.map((id, i) => [
            id,
            {
              type: "topic",
              title: `View${i}`,
              url: `/documentation/${id}`,
              kind: "symbol",
              role: "symbol",
              fragments: [{ kind: "keyword", text: "struct" }],
            },
          ]),
        ),
      });

      const result = await handleFindSimilarApis({
        apiUrl: mockApiUrl,
        searchDepth: "shallow",
        filterByCategory: undefined,
        includeAlternatives: true,
        limit: 15,
      });

      expect(result).toContain("5 similar APIs");
      expect(result).toContain("Showing 5 of 7.");
    });

    it("should not mention a cap when everything fits", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleFindSimilarApis({
        apiUrl: mockApiUrl,
        searchDepth: "medium",
        filterByCategory: undefined,
        includeAlternatives: true,
        limit: 4,
      });

      expect(result).not.toContain("…and");
      expect(result).not.toContain("Showing");
    });

    it("should handle APIs with no similar items", async () => {
      const noSimilarResponse = {
        data: {
          identifier: "swiftui/text",
          metadata: { title: "Text", roleHeading: "Structure" },
        },
        references: {},
      };

      mockHttpClient.getJson.mockResolvedValue(noSimilarResponse);

      const result = await handleFindSimilarApis({
        apiUrl: mockApiUrl,
        searchDepth: "medium",
        filterByCategory: undefined,
        includeAlternatives: true,
        limit: 15,
      });

      expect(result).toContain("# Similar APIs to Text");
      expect(result).toContain("No similar APIs found");
    });

    it("should handle invalid URL", async () => {
      mockConvertToJsonApiUrl.mockReturnValue(null);

      await expect(
        handleFindSimilarApis({
          apiUrl: "invalid-url",
          searchDepth: "medium",
          filterByCategory: undefined,
          includeAlternatives: true,
          limit: 15,
        }),
      ).rejects.toThrow("Invalid Apple Developer Documentation URL");
    });

    it("should handle fetch errors gracefully", async () => {
      mockHttpClient.getJson.mockRejectedValue(new Error("Network error"));

      await expect(
        handleFindSimilarApis({
          apiUrl: mockApiUrl,
          searchDepth: "medium",
          filterByCategory: undefined,
          includeAlternatives: true,
          limit: 15,
        }),
      ).rejects.toThrow("Network error");
    });

    it("should deduplicate similar APIs across sections", async () => {
      const duplicateResponse = {
        data: {
          identifier: "swiftui/text",
          title: "Text",
          seeAlsoSections: [
            {
              title: "Section 1",
              identifiers: ["swiftui/label", "swiftui/textfield"],
            },
            {
              title: "Section 2",
              identifiers: ["swiftui/label", "swiftui/image"],
            },
          ],
        },
        references: {
          "swiftui/label": {
            type: "topic",
            title: "Label",
            url: "/documentation/swiftui/label",
          },
          "swiftui/textfield": {
            type: "topic",
            title: "TextField",
            url: "/documentation/swiftui/textfield",
          },
          "swiftui/image": {
            type: "topic",
            title: "Image",
            url: "/documentation/swiftui/image",
          },
        },
      };

      mockHttpClient.getJson.mockResolvedValue(duplicateResponse);

      const result = await handleFindSimilarApis({
        apiUrl: mockApiUrl,
        searchDepth: "medium",
        filterByCategory: undefined,
        includeAlternatives: true,
        limit: 15,
      });

      // Label should appear only once despite being in two sections
      const labelOccurrences = (result.match(/- \[Label\]/g) || []).length;
      expect(labelOccurrences).toBe(1);
      expect(result).toContain("3 similar APIs");
    });
  });

  it("lists the replacements a deprecated API names first, keeping code names in summaries", async () => {
    mockHttpClient.getJson.mockResolvedValue({
      title: "NavigationView",
      deprecationSummary: [
        {
          type: "paragraph",
          inlineContent: [
            { type: "text", text: "Use " },
            {
              type: "reference",
              identifier: "doc://SwiftUI/NavigationStack",
              isActive: true,
            },
            { type: "text", text: " and " },
            {
              type: "reference",
              identifier: "doc://SwiftUI/NavigationSplitView",
              isActive: true,
            },
            { type: "text", text: " instead." },
          ],
        },
      ],
      seeAlsoSections: [
        { title: "Deprecated Types", identifiers: ["doc://SwiftUI/tabItem"] },
      ],
      references: {
        "doc://SwiftUI/NavigationStack": {
          type: "topic",
          kind: "symbol",
          title: "NavigationStack",
          url: "/documentation/swiftui/navigationstack",
          abstract: [
            { type: "text", text: "A view that displays a root view." },
          ],
        },
        "doc://SwiftUI/NavigationSplitView": {
          type: "topic",
          kind: "symbol",
          title: "NavigationSplitView",
          url: "/documentation/swiftui/navigationsplitview",
          abstract: [
            { type: "text", text: "Pairs with " },
            { type: "reference", identifier: "doc://SwiftUI/NavigationStack" },
            { type: "text", text: "." },
          ],
        },
        "doc://SwiftUI/tabItem": {
          type: "topic",
          kind: "symbol",
          title: "tabItem(_:)",
          url: "/documentation/swiftui/view/tabitem(_:)",
        },
      },
    });

    const result = await handleFindSimilarApis({
      apiUrl:
        "https://developer.apple.com/documentation/swiftui/navigationview",
      searchDepth: "medium",
      filterByCategory: undefined,
      includeAlternatives: true,
      limit: 15,
    });

    expect(result).toContain(
      "**Deprecated:** Use [`NavigationStack`](https://developer.apple.com/documentation/swiftui/navigationstack) " +
        "and [`NavigationSplitView`](https://developer.apple.com/documentation/swiftui/navigationsplitview) instead.",
    );
    expect(result.indexOf("[NavigationSplitView]")).toBeLessThan(
      result.indexOf("[tabItem(_:)]"),
    );
    expect(result).toContain("## Replacement: Named in the deprecation note");
    expect(result).toContain("Pairs with `NavigationStack`.");
  });
});
