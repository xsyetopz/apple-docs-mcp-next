import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";
import { httpClient } from "../../src/core/http-client.ts";
import { handleGetRelatedApis } from "../../src/docs/get-related-apis.ts";
import { convertToJsonApiUrl } from "../../src/docs/url-converter.ts";
import type { Mocked } from "../helpers/test-helpers.ts";
import { httpClientModule } from "../mocks/http-client.mock.ts";

mock.module("../../src/core/http-client.ts", httpClientModule);
mock.module("../../src/docs/url-converter.ts", () => ({
  convertToJsonApiUrl: mock(),
  isValidAppleDeveloperUrl: mock().mockReturnValue(true),
}));

const mockHttpClient = httpClient as Mocked<typeof httpClient>;
const mockConvertToJsonApiUrl = convertToJsonApiUrl as Mock<
  typeof convertToJsonApiUrl
>;

describe("get-related-apis", () => {
  beforeEach(() => {
    mock.clearAllMocks();
    mockConvertToJsonApiUrl.mockReturnValue(
      "https://developer.apple.com/documentation/swiftui/view.json",
    );
  });

  describe("handleGetRelatedApis", () => {
    const mockApiUrl = "https://developer.apple.com/documentation/swiftui/view";
    const mockJsonResponse = {
      identifier: "swiftui/view",
      title: "View",
      abstract: [
        { type: "text", text: "A type that represents a SwiftUI view." },
      ],
      metadata: {
        roleHeading: "Protocol",
        platforms: [{ name: "iOS", introducedAt: "13.0" }],
      },
      relationshipsSections: [
        {
          type: "inheritsFrom",
          title: "Inherits From",
          identifiers: ["swiftui/protocol1"],
        },
        {
          type: "conformsTo",
          title: "Conforms To",
          identifiers: ["swiftui/protocol2", "swiftui/protocol3"],
        },
      ],
      seeAlsoSections: [
        {
          title: "Related Views",
          identifiers: ["swiftui/text", "swiftui/image"],
        },
      ],
      references: {
        "swiftui/protocol1": {
          type: "topic",
          title: "Protocol1",
          url: "/documentation/swiftui/protocol1",
          kind: "symbol",
        },
        "swiftui/protocol2": {
          type: "topic",
          title: "Protocol2",
          url: "/documentation/swiftui/protocol2",
          kind: "symbol",
        },
        "swiftui/protocol3": {
          type: "topic",
          title: "Protocol3",
          url: "/documentation/swiftui/protocol3",
          kind: "symbol",
        },
        "swiftui/text": {
          type: "topic",
          title: "Text",
          url: "/documentation/swiftui/text",
          abstract: [{ type: "text", text: "A view that displays text." }],
          kind: "symbol",
        },
        "swiftui/image": {
          type: "topic",
          title: "Image",
          url: "/documentation/swiftui/image",
          abstract: [{ type: "text", text: "A view that displays an image." }],
          kind: "symbol",
        },
      },
    };

    it("groups the Topics members under their section titles", async () => {
      mockHttpClient.getJson.mockResolvedValue({
        ...mockJsonResponse,
        topicSections: [
          { title: "Creating a View", identifiers: ["swiftui/text"] },
          {
            title: "Showing Images",
            identifiers: [
              "swiftui/image",
              "swiftui/protocol1",
              "swiftui/protocol2",
              "swiftui/protocol3",
              "swiftui/text",
            ],
          },
        ],
        seeAlsoSections: [],
      });

      const result = await handleGetRelatedApis({
        apiUrl: mockApiUrl,
        includeInherited: true,
        includeConformance: true,
        includeSeeAlso: true,
        limit: 10,
      });

      expect(result).toContain(
        "## Topics\n- Creating a View: [Text](https://developer.apple.com/documentation/swiftui/text)\n- Showing Images: [Image](https://developer.apple.com/documentation/swiftui/image)",
      );
      expect(result).toContain(
        "- Showing Images: [Image](https://developer.apple.com/documentation/swiftui/image), +2 more",
      );
    });

    it("should get all related APIs by default", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleGetRelatedApis({
        apiUrl: mockApiUrl,
        includeInherited: true,
        includeConformance: true,
        includeSeeAlso: true,
        limit: 10,
      });

      expect(mockConvertToJsonApiUrl).toHaveBeenCalledWith(mockApiUrl);
      expect(mockHttpClient.getJson).toHaveBeenCalledWith(
        "https://developer.apple.com/documentation/swiftui/view.json",
      );

      expect(result).toContain("# Related APIs for view");
      expect(result).toContain("5 related APIs");
      expect(result).toContain("## Inherits From");
      expect(result).toContain("[Protocol1]");
      expect(result).toContain("## Conforms To");
      expect(result).toContain("[Protocol2]");
      expect(result).toContain("[Protocol3]");
      expect(result).toContain("## See Also");
      expect(result).toContain("[Text]");
      expect(result).toContain("A view that displays text.");
    });

    it("should print one line per API: link, then summary", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleGetRelatedApis({
        apiUrl: mockApiUrl,
        includeInherited: true,
        includeConformance: true,
        includeSeeAlso: true,
        limit: 10,
      });

      expect(result).toContain(
        "- [Text](https://developer.apple.com/documentation/swiftui/text): A view that displays text.",
      );
      expect(result).not.toContain("###");
      expect(result).not.toContain("*Type:");
      expect(result).not.toContain("…and");
    });

    it("should cap each group at limit and end it with how many more", async () => {
      const ids = ["a", "b", "c", "d", "e"].map((name) => `swiftui/${name}`);
      mockHttpClient.getJson.mockResolvedValue({
        relationshipsSections: [
          { type: "conformsTo", title: "Conforms To", identifiers: ids },
        ],
        seeAlsoSections: [
          { title: "More", identifiers: ids.slice(0, 2).map((id) => `${id}2`) },
        ],
        references: Object.fromEntries(
          [...ids, ...ids.slice(0, 2).map((id) => `${id}2`)].map((id) => [
            id,
            {
              type: "topic",
              title: id.toUpperCase(),
              url: `/documentation/${id}`,
              kind: "symbol",
            },
          ]),
        ),
      });

      const result = await handleGetRelatedApis({
        apiUrl: mockApiUrl,
        includeInherited: true,
        includeConformance: true,
        includeSeeAlso: true,
        limit: 3,
      });

      expect(result).toContain("7 related APIs");
      expect(result).toContain("[SWIFTUI/C]");
      expect(result).not.toContain("[SWIFTUI/D]");
      expect(result).toContain("…and 2 more");
      expect(result.match(/…and/g)).toHaveLength(1);
      expect(result).toContain("## See Also\n- [SWIFTUI/A2]");
      expect(result).toContain("Showing 3 per group. Raise limit");
    });

    it("should exclude inherited APIs when includeInherited is false", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleGetRelatedApis({
        apiUrl: mockApiUrl,
        includeInherited: false,
        includeConformance: true,
        includeSeeAlso: true,
        limit: 10,
      });

      expect(result).not.toContain("## Inherits From");
      expect(result).not.toContain("Protocol1");
      expect(result).toContain("## Conforms To");
      expect(result).toContain("## See Also");
    });

    it("should exclude conformance when includeConformance is false", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleGetRelatedApis({
        apiUrl: mockApiUrl,
        includeInherited: true,
        includeConformance: false,
        includeSeeAlso: true,
        limit: 10,
      });

      expect(result).toContain("## Inherits From");
      expect(result).not.toContain("## Conforms To");
      expect(result).not.toContain("Protocol2");
      expect(result).toContain("## See Also");
    });

    it("should exclude see also when includeSeeAlso is false", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockJsonResponse);

      const result = await handleGetRelatedApis({
        apiUrl: mockApiUrl,
        includeInherited: true,
        includeConformance: true,
        includeSeeAlso: false,
        limit: 10,
      });

      expect(result).toContain("## Inherits From");
      expect(result).toContain("## Conforms To");
      expect(result).not.toContain("## See Also");
      expect(result).not.toContain("Text");
    });

    it("should handle APIs with no relationships", async () => {
      const noRelationshipsResponse = {
        identifier: "swiftui/view",
        title: "View",
        metadata: { roleHeading: "Protocol" },
        references: {},
      };

      mockHttpClient.getJson.mockResolvedValue(noRelationshipsResponse);

      const result = await handleGetRelatedApis({
        apiUrl: mockApiUrl,
        includeInherited: true,
        includeConformance: true,
        includeSeeAlso: true,
        limit: 10,
      });

      expect(result).toContain("No related APIs found for:");
      expect(result).toContain(mockApiUrl);
    });

    it("should handle invalid URL", async () => {
      mockConvertToJsonApiUrl.mockReturnValue(null);

      await expect(
        handleGetRelatedApis({
          apiUrl: "invalid-url",
          includeInherited: true,
          includeConformance: true,
          includeSeeAlso: true,
          limit: 10,
        }),
      ).rejects.toThrow("Invalid Apple Developer Documentation URL");
    });

    it("should handle fetch errors", async () => {
      mockHttpClient.getJson.mockRejectedValue(new Error("Network error"));

      await expect(
        handleGetRelatedApis({
          apiUrl: mockApiUrl,
          includeInherited: true,
          includeConformance: true,
          includeSeeAlso: true,
          limit: 10,
        }),
      ).rejects.toThrow("Network error");
    });

    it("should handle malformed JSON response", async () => {
      mockHttpClient.getJson.mockResolvedValue({ invalid: "response" });

      const result = await handleGetRelatedApis({
        apiUrl: mockApiUrl,
        includeInherited: true,
        includeConformance: true,
        includeSeeAlso: true,
        limit: 10,
      });

      expect(result).toContain("No related APIs found for:");
    });

    it("should format complex relationships correctly", async () => {
      const complexResponse = {
        identifier: "swiftui/view",
        title: "View",
        metadata: {
          roleHeading: "Protocol",
          platforms: [
            { name: "iOS", introducedAt: "13.0" },
            { name: "macOS", introducedAt: "10.15" },
          ],
        },
        relationshipsSections: [
          {
            type: "conformingTypes",
            title: "Conforming Types",
            identifiers: ["swiftui/anyview", "swiftui/emptyview"],
          },
        ],
        references: {
          "swiftui/anyview": {
            type: "topic",
            title: "AnyView",
            url: "/documentation/swiftui/anyview",
            abstract: [{ type: "text", text: "A type-erased view." }],
            kind: "symbol",
          },
          "swiftui/emptyview": {
            type: "topic",
            title: "EmptyView",
            url: "/documentation/swiftui/emptyview",
            abstract: [
              { type: "text", text: "A view that doesn't display anything." },
            ],
            kind: "symbol",
          },
        },
      };

      mockHttpClient.getJson.mockResolvedValue(complexResponse);

      const result = await handleGetRelatedApis({
        apiUrl: mockApiUrl,
        includeInherited: true,
        includeConformance: true,
        includeSeeAlso: true,
        limit: 10,
      });

      expect(result).toContain("# Related APIs for view");
      expect(result).toContain("2 related APIs");
      expect(result).toContain("## Conforming Types");
      expect(result).toContain("[AnyView]");
      expect(result).toContain("A type-erased view.");
      expect(result).toContain("[EmptyView]");
      expect(result).toContain("A view that doesn't display anything.");
    });
  });

  it("keeps code names and links in summaries", async () => {
    mockHttpClient.getJson.mockResolvedValue({
      seeAlsoSections: [
        {
          title: "Stacking views in one column",
          identifiers: ["doc://SwiftUI/destination"],
        },
      ],
      references: {
        "doc://SwiftUI/destination": {
          type: "topic",
          kind: "symbol",
          title: "navigationDestination(isPresented:destination:)",
          url: "/documentation/swiftui/view/navigationdestination(ispresented:destination:)",
          abstract: [
            { type: "text", text: "Pushes the view onto a " },
            { type: "reference", identifier: "doc://SwiftUI/NavigationStack" },
            { type: "text", text: "." },
          ],
        },
        "doc://SwiftUI/NavigationStack": {
          type: "topic",
          kind: "symbol",
          title: "NavigationStack",
          url: "/documentation/swiftui/navigationstack",
        },
      },
    });

    const result = await handleGetRelatedApis({
      apiUrl:
        "https://developer.apple.com/documentation/swiftui/navigationstack",
      includeInherited: true,
      includeConformance: true,
      includeSeeAlso: true,
      limit: 10,
    });

    expect(result).toContain("Pushes the view onto a `NavigationStack`.");
  });
});
