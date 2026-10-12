import { z } from "zod";

export const getAppleDocContentSchema = z.object({
  url: z
    .string()
    .describe(
      'Full URL of the Apple Developer Documentation page. Must start with https://developer.apple.com/documentation/, https://developer.apple.com/design/human-interface-guidelines/, https://developer.apple.com/tutorials/ or https://developer.apple.com/help/app-store-connect/. Example: "https://developer.apple.com/documentation/uikit/uiviewcontroller"',
    ),
  includeRelatedApis: z
    .boolean()
    .default(false)
    .describe(
      "Include inheritance hierarchy and protocol conformances. Useful for understanding API relationships. Default: false",
    ),
  includeReferences: z
    .boolean()
    .default(false)
    .describe(
      "Resolve and include all referenced types and APIs. Helps understand dependencies. Default: false",
    ),
  includeSimilarApis: z
    .boolean()
    .default(false)
    .describe(
      "Discover APIs with similar functionality. Great for finding alternatives. Default: false",
    ),
  includePlatformAnalysis: z
    .boolean()
    .default(false)
    .describe(
      "Analyze platform availability and version requirements. Essential for cross-platform development. Default: false",
    ),
});
