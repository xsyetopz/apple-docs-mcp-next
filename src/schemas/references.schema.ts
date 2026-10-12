import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

export const resolveReferencesBatchSchema = z.object({
  sourceUrl: z
    .string()
    .describe(
      'Documentation URL to analyze for references. Example: "https://developer.apple.com/documentation/swiftui/view"',
    ),
  maxReferences: z
    .number()
    .min(1)
    .max(API_LIMITS.MAX_REFERENCES_LIMIT)
    .default(API_LIMITS.DEFAULT_REFERENCES_LIMIT)
    .describe(
      "Limit resolved references (default: 20, max: 50). Higher values = more comprehensive but slower.",
    ),
  filterByType: z
    .enum([
      "all",
      "symbol",
      "collection",
      "article",
      "protocol",
      "class",
      "struct",
      "enum",
    ])
    .default("all")
    .describe(
      'Filter by reference type. Use "protocol" for protocol requirements, "class" for class hierarchies. Default: "all"',
    ),
});
