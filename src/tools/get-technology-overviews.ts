import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { handleGetTechnologyOverviews } from "../docs/get-technology-overviews.ts";
import { defineTool } from "./define-tool.ts";

export const getTechnologyOverviewsTool = defineTool({
  name: "get_technology_overviews",
  title: "Get Technology Overviews",
  description:
    "Apple's Technology Overviews guides: its collections, each with Apple's summary, and the articles in each, as one tree in Apple's order. category gives one collection with everything in it; searchQuery gives a flat list of the entries that mention it, each with the collection it is in. Returns links, not the articles; read one with get_apple_doc_content.",
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe(
        'One collection, by the last segment of its link or its title, such as "app-design-and-ui", "games", "ai-machine-learning" or "liquid-glass"; an unknown one returns the list. Leave empty for all.',
      ),
    searchQuery: z
      .string()
      .optional()
      .describe(
        'Keeps the collections and articles whose title or summary contain it, such as "data", "SwiftUI", "machine learning" or "performance". Articles carry no summary in Apple\'s index, so their titles decide.',
      ),
    includeSubcategories: z
      .boolean()
      .default(true)
      .describe(
        "false lists only the collections, without their articles. Default: true",
      ),
    limit: z
      .number()
      .min(1)
      .max(API_LIMITS.MAX_TECHNOLOGY_OVERVIEWS_LIMIT)
      .default(API_LIMITS.DEFAULT_TECHNOLOGY_OVERVIEWS_LIMIT)
      .describe(
        "Most entries to print, collections and articles together. Default: 50",
      ),
  }),
  run: handleGetTechnologyOverviews,
});
