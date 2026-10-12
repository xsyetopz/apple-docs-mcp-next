import { z } from "zod";
import { API_LIMITS } from "../utils/constants.ts";

export const getTechnologyOverviewsSchema = z.object({
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
});
