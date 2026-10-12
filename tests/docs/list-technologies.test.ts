import { beforeEach, describe, expect, it, mock } from "bun:test";
import { httpClient } from "../../src/core/http-client.ts";
import { handleListTechnologies } from "../../src/docs/list-technologies.ts";
import type { Mocked } from "../helpers/test-helpers.ts";
import { httpClientModule } from "../mocks/http-client.mock.ts";

mock.module("../../src/core/http-client.ts", httpClientModule);
mock.module("../../src/core/cache.ts", () => ({
  technologiesCache: {
    get: mock(),
    set: mock(),
  },
  generateUrlCacheKey: mock().mockImplementation(
    (url, params) => `${url}-${JSON.stringify(params)}`,
  ),
}));

const mockHttpClient = httpClient as Mocked<typeof httpClient>;

describe("list-technologies", () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  describe("handleListTechnologies", () => {
    const mockTechnologiesResponse = {
      references: {},
      sections: [
        {
          kind: "technologies",
          groups: [
            {
              name: "Featured",
              technologies: [
                {
                  title: "SwiftUI",
                  identifier: "swiftui",
                  tags: [],
                  languages: ["swift"],
                  destination: {
                    identifier:
                      "doc://com.apple.documentation/documentation/swiftui",
                  },
                },
                {
                  title: "UIKit",
                  identifier: "uikit",
                  tags: [],
                  languages: ["swift", "occ"],
                  destination: {
                    identifier:
                      "doc://com.apple.documentation/documentation/uikit",
                  },
                },
              ],
            },
            {
              name: "App Frameworks",
              technologies: [
                {
                  title: "Foundation",
                  identifier: "foundation",
                  tags: [],
                  languages: ["swift", "occ"],
                  destination: {
                    identifier:
                      "doc://com.apple.documentation/documentation/foundation",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    it("should list all technologies without filters", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockTechnologiesResponse);

      const result = await handleListTechnologies();

      expect(mockHttpClient.getJson).toHaveBeenCalledWith(
        "https://developer.apple.com/tutorials/data/documentation/technologies.json",
      );
      expect(result).toContain("# Apple Developer Technologies");
      expect(result).toContain("## Featured");
      expect(result).toContain("[SwiftUI]");
      expect(result).toContain("## App Frameworks");
      expect(result).toContain("[Foundation]");
    });

    it("should filter by category", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockTechnologiesResponse);

      const result = await handleListTechnologies("app frameworks");

      expect(result).toContain("## App Frameworks");
      expect(result).toContain("[Foundation]");
      expect(result).not.toContain("## Featured");
      expect(result).not.toContain("[SwiftUI]");
    });

    it("should handle case-insensitive category filtering", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockTechnologiesResponse);

      const result = await handleListTechnologies("APP FRAMEWORKS");

      expect(result).toContain("## App Frameworks");
      expect(result).toContain("[Foundation]");
    });

    it("should filter by language", async () => {
      const mockResponseWithLanguage = {
        references: {},
        sections: [
          {
            kind: "technologies",
            groups: [
              {
                name: "Featured",
                technologies: [
                  {
                    title: "SwiftUI",
                    identifier: "swiftui",
                    tags: [],
                    languages: ["swift"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/swiftui",
                    },
                  },
                  {
                    title: "Core Foundation",
                    identifier: "corefoundation",
                    tags: [],
                    languages: ["occ"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/corefoundation",
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      mockHttpClient.getJson.mockResolvedValue(mockResponseWithLanguage);

      const result = await handleListTechnologies(undefined, "swift");

      expect(result).toContain("[SwiftUI]");
      expect(result).not.toContain("Core Foundation");
    });

    it("should exclude beta technologies when includeBeta is false", async () => {
      // Apple marks a beta technology on its reference
      const mockResponseWithBeta = {
        references: {
          "doc://com.apple.documentation/documentation/swiftui": {
            identifier: "doc://com.apple.documentation/documentation/swiftui",
            beta: true,
          },
        },
        sections: [
          {
            kind: "technologies",
            groups: [
              {
                name: "Featured",
                technologies: [
                  {
                    title: "SwiftUI",
                    identifier: "swiftui",
                    tags: [],
                    languages: ["swift"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/swiftui",
                    },
                  },
                  {
                    title: "UIKit",
                    identifier: "uikit",
                    tags: [],
                    languages: ["swift", "occ"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/uikit",
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      mockHttpClient.getJson.mockResolvedValue(mockResponseWithBeta);

      const result = await handleListTechnologies(undefined, undefined, false);

      expect(result).not.toContain("SwiftUI");
      expect(result).toContain("[UIKit]");
    });

    it("should handle empty response", async () => {
      mockHttpClient.getJson.mockResolvedValue({
        references: {},
        sections: [],
      });

      const result = await handleListTechnologies();

      expect(result).toContain(
        "No technologies found matching the specified criteria.",
      );
    });

    it("should handle fetch errors", async () => {
      mockHttpClient.getJson.mockRejectedValue(new Error("Network error"));

      const result = await handleListTechnologies();

      expect(result).toContain("Error: Failed to list technologies:");
      expect(result).toContain("Network error");
    });

    it("should report malformed JSON as an error", async () => {
      mockHttpClient.getJson.mockResolvedValue({ invalid: "response" });

      const result = await handleListTechnologies();

      expect(result).toContain("Error: Failed to list technologies:");
    });

    it("should return detailed technology information when available", async () => {
      const detailedResponse = {
        references: {},
        sections: [
          {
            kind: "technologies",
            groups: [
              {
                name: "Graphics & Games",
                technologies: [
                  {
                    title: "Metal",
                    identifier: "metal",
                    tags: ["Graphics", "Games"],
                    languages: ["swift", "occ"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/metal",
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      mockHttpClient.getJson.mockResolvedValue(detailedResponse);

      const result = await handleListTechnologies();

      expect(result).toContain("[Metal]");
      expect(result).toContain("Languages: swift, occ");
      expect(result).toContain("Categories: Graphics, Games");
    });

    it("should apply the limit to each category", async () => {
      const limitTestResponse = {
        references: {},
        sections: [
          {
            kind: "technologies",
            groups: [
              {
                name: "UI Frameworks",
                technologies: [
                  {
                    title: "SwiftUI",
                    identifier: "swiftui",
                    tags: ["UI"],
                    languages: ["swift"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/swiftui",
                    },
                  },
                  {
                    title: "UIKit",
                    identifier: "uikit",
                    tags: ["UI"],
                    languages: ["swift", "occ"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/uikit",
                    },
                  },
                  {
                    title: "AppKit",
                    identifier: "appkit",
                    tags: ["UI"],
                    languages: ["swift", "occ"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/appkit",
                    },
                  },
                ],
              },
              {
                name: "Data Frameworks",
                technologies: [
                  {
                    title: "Core Data",
                    identifier: "coredata",
                    tags: ["Data"],
                    languages: ["swift", "occ"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/coredata",
                    },
                  },
                  {
                    title: "CloudKit",
                    identifier: "cloudkit",
                    tags: ["Data"],
                    languages: ["swift", "occ"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/cloudkit",
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      mockHttpClient.getJson.mockResolvedValue(limitTestResponse);

      const result = await handleListTechnologies(
        undefined,
        undefined,
        true,
        2,
      );

      // The first 2 of each category
      expect(result).toContain("SwiftUI");
      expect(result).toContain("UIKit");
      expect(result).not.toContain("AppKit");
      expect(result).toContain("Core Data");
      expect(result).toContain("CloudKit");
      expect(result).toContain("Found 4 technologies");
    });

    it("should list every category under the limit", async () => {
      const multiGroupResponse = {
        references: {},
        sections: [
          {
            kind: "technologies",
            groups: [
              {
                name: "Group A",
                technologies: [
                  {
                    title: "Tech 1",
                    identifier: "tech1",
                    tags: [],
                    languages: ["swift"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/tech1",
                    },
                  },
                  {
                    title: "Tech 2",
                    identifier: "tech2",
                    tags: [],
                    languages: ["swift"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/tech2",
                    },
                  },
                ],
              },
              {
                name: "Group B",
                technologies: [
                  {
                    title: "Tech 3",
                    identifier: "tech3",
                    tags: [],
                    languages: ["swift"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/tech3",
                    },
                  },
                  {
                    title: "Tech 4",
                    identifier: "tech4",
                    tags: [],
                    languages: ["swift"],
                    destination: {
                      identifier:
                        "doc://com.apple.documentation/documentation/tech4",
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      mockHttpClient.getJson.mockResolvedValue(multiGroupResponse);

      const result = await handleListTechnologies(
        undefined,
        undefined,
        true,
        1,
      );

      // The first of each category
      expect(result).toContain("Tech 1");
      expect(result).not.toContain("Tech 2");
      expect(result).toContain("Tech 3");
      expect(result).not.toContain("Tech 4");
      expect(result).toContain("Found 2 technologies");
    });

    it("should handle zero limit", async () => {
      mockHttpClient.getJson.mockResolvedValue(mockTechnologiesResponse);

      const result = await handleListTechnologies(
        undefined,
        undefined,
        true,
        0,
      );

      expect(result).toContain(
        "No technologies found matching the specified criteria.",
      );
    });
  });
});
