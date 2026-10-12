import { z } from "zod";

export const getRelatedApisSchema = z.object({
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
});
