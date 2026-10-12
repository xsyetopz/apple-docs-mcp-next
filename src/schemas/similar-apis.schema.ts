import { z } from "zod";

export const findSimilarApisSchema = z.object({
  apiUrl: z
    .string()
    .describe(
      'Starting API URL. Example: "https://developer.apple.com/documentation/uikit/uialertview" (finds modern alternatives)',
    ),
  searchDepth: z
    .enum(["shallow", "medium", "deep"])
    .default("medium")
    .describe(
      'How thoroughly to search. "shallow" = direct recommendations only, "medium" = topic siblings, "deep" = full relationship analysis. Default: "medium"',
    ),
  filterByCategory: z
    .string()
    .optional()
    .describe(
      'Focus on specific functionality like "Animation", "Navigation", "Data". Keeps the See Also and Topics groups whose title contains it, in any case.',
    ),
  includeAlternatives: z
    .boolean()
    .default(true)
    .describe(
      "Include functionally similar APIs that might be better choices. Default: true",
    ),
});
