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

      const result = await handleFindSimilarApis(mockApiUrl, "shallow");

      expect(mockConvertToJsonApiUrl).toHaveBeenCalledWith(mockApiUrl);
      expect(mockHttpClient.getJson).toHaveBeenCalledTimes(1);

      expect(result).toContain("# Similar APIs to Text");
      expect(result).toContain("Structure · iOS 13.0+");
      expect(result).toContain("## See Also: Text Display");
      expect(result).toContain("### [Label]");
      expect(result).toContain("A view that displays text and an icon.");
      expect(result).toContain("### [TextField]");
      expect(result).toContain("2 similar APIs found");
    });

    it("should include topic sections with medium search depth", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleFindSimilarApis(mockApiUrl, "medium");

      expect(result).toContain("## See Also: Text Display");
      expect(result).toContain("## Topic Group: Creating Text Views");
      expect(result).toContain("### [init(_:)]");
      expect(result).toContain("### [init(String)]");
      expect(result).toContain("4 similar APIs found");
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

      const result = await handleFindSimilarApis(mockApiUrl, "deep");

      // Deep search makes multiple calls (1 initial + up to 3 for related APIs)
      expect(mockHttpClient.getJson.mock.calls.length).toBeGreaterThanOrEqual(
        2,
      );
      expect(result).toContain("## See Also: Text Display");
      expect(result).toContain("### [Label]");
      expect(result).toContain("LabelStyle");
    });

    it("should filter by category", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleFindSimilarApis(
        mockApiUrl,
        "medium",
        "Creating",
      );

      expect(result).toContain("## Topic Group: Creating Text Views");
      expect(result).not.toContain("## See Also: Text Display");
      expect(result).toContain("2 similar APIs found");
    });

    it("should exclude alternatives when includeAlternatives is false", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleFindSimilarApis(
        mockApiUrl,
        "medium",
        undefined,
        false,
      );

      expect(result).toContain("## See Also: Text Display");
      expect(result).not.toContain("## Topic Group: Creating Text Views");
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

      const result = await handleFindSimilarApis(mockApiUrl);

      expect(result).toContain("# Similar APIs to Text");
      expect(result).toContain("No similar APIs found");
    });

    it("should handle invalid URL", async () => {
      mockConvertToJsonApiUrl.mockReturnValue(null);

      await expect(handleFindSimilarApis("invalid-url")).rejects.toThrow(
        "Invalid Apple Developer Documentation URL",
      );
    });

    it("should handle fetch errors gracefully", async () => {
      mockHttpClient.getJson.mockRejectedValue(new Error("Network error"));

      await expect(handleFindSimilarApis(mockApiUrl)).rejects.toThrow(
        "Network error",
      );
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

      const result = await handleFindSimilarApis(mockApiUrl);

      // Label should appear only once despite being in two sections
      const labelOccurrences = (result.match(/### \[Label\]/g) || []).length;
      expect(labelOccurrences).toBe(1);
      expect(result).toContain("3 similar APIs found");
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

    const result = await handleFindSimilarApis(
      "https://developer.apple.com/documentation/swiftui/navigationview",
      "medium",
      undefined,
      true,
    );

    expect(result).toContain(
      "**Deprecated:** Use [`NavigationStack`](https://developer.apple.com/documentation/swiftui/navigationstack) " +
        "and [`NavigationSplitView`](https://developer.apple.com/documentation/swiftui/navigationsplitview) instead.",
    );
    expect(result.indexOf("[NavigationSplitView]")).toBeLessThan(
      result.indexOf("[tabItem(_:)]"),
    );
    expect(result).toContain("Similarity: 10/10");
    expect(result).toContain("Pairs with `NavigationStack`.");
  });
});
