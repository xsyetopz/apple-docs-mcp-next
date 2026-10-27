import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { handleGetTechnologyOverviews } from "../docs/get-technology-overviews.ts";
import { defineTool } from "./define-tool.ts";

export const getTechnologyOverviewsTool = defineTool({
  name: "get_technology_overviews",
  title: "Get Technology Overviews",
  description:
    "Apple's Technology Overviews guides: collections with summaries and their articles, in Apple's order. Links only; read one with get_apple_doc_content.",
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe(
        'One collection, by link segment or title, e.g. "games" or "liquid-glass"; an unknown one lists them all',
      ),
    searchQuery: z
      .string()
      .optional()
      .describe(
        'Keeps entries whose title or summary contains it, e.g. "performance"',
      ),
    includeSubcategories: z
      .boolean()
      .default(true)
      .describe("false lists only the collections"),
    limit: z
      .number()
      .min(1)
      .max(API_LIMITS.MAX_TECHNOLOGY_OVERVIEWS_LIMIT)
      .default(API_LIMITS.DEFAULT_TECHNOLOGY_OVERVIEWS_LIMIT)
      .describe("Collections and articles together"),
  }),
  run: handleGetTechnologyOverviews,
});
