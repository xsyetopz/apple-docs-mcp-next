import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

export const getSampleCodeSchema = z.object({
  framework: z
    .string()
    .optional()
    .describe(
      'Framework filter (case-insensitive). Examples: "SwiftUI", "ARKit", "CoreML". Note: Some samples are under generic categories - use searchQuery for better results.',
    ),
  beta: z
    .enum(["include", "exclude", "only"])
    .default("include")
    .describe(
      'Beta samples: "include" = all, "exclude" = stable only, "only" = beta only. Default: "include"',
    ),
  searchQuery: z
    .string()
    .optional()
    .describe(
      'Search keywords. Most effective approach. Examples: "animation", "camera", "machine learning", "widgets".',
    ),
  limit: z
    .number()
    .min(1)
    .max(API_LIMITS.MAX_SAMPLE_CODE_LIMIT)
    .default(API_LIMITS.DEFAULT_SAMPLE_CODE_LIMIT)
    .describe("Max results (default: 50)."),
});
