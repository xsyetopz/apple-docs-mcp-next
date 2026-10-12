import { z } from "zod";

import { handleFindSimilarApis } from "../docs/find-similar-apis.ts";
import { defineTool } from "./define-tool.ts";

export const findSimilarApisTool = defineTool({
  name: "find_similar_apis",
  title: "Find Similar APIs",
  description:
    'Alternatives to one API, read from its page\'s JSON: for a deprecated API, first the pages its deprecation note names (Apple\'s replacements, scored 10/10), then its See Also group (8/10) and, with searchDepth "medium" or "deep", its Topics groups (6/10); "deep" also reads the See Also of the first results. The scores come from where an API was found, not from comparing APIs.',
  inputSchema: z.object({
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
  }),
  run: handleFindSimilarApis,
});
