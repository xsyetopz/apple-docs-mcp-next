import { z } from "zod";

import { handleGetRelatedApis } from "../docs/get-related-apis.ts";
import { defineTool } from "./define-tool.ts";

export const getRelatedApisTool = defineTool({
  name: "get_related_apis",
  title: "Get Related APIs",
  description:
    "The APIs one documentation page relates to, read from that page's JSON alone: what it inherits from and conforms to, its See Also group and the first 3 APIs of each Topics group, each with its link and Apple's one-line summary.",
  inputSchema: z.object({
    apiUrl: z
      .string()
      .describe(
        'Apple documentation URL to analyze. Example: "https://developer.apple.com/documentation/uikit/uiview"',
      ),
    includeInherited: z
      .boolean()
      .default(true)
      .describe(
        "Show inherited methods/properties from superclasses. Helps understand full API surface. Default: true",
      ),
    includeConformance: z
      .boolean()
      .default(true)
      .describe(
        "Show protocol conformances and requirements. Essential for protocol-oriented programming. Default: true",
      ),
    includeSeeAlso: z
      .boolean()
      .default(true)
      .describe(
        "Show Apple's recommended related APIs. Great for finding better alternatives or complementary APIs. Default: true",
      ),
  }),
  run: handleGetRelatedApis,
});
