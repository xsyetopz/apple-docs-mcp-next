import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { handleResolveReferencesBatch } from "../docs/resolve-references-batch.ts";
import { defineTool } from "./define-tool.ts";

export const resolveReferencesBatchTool = defineTool({
  name: "resolve_references_batch",
  title: "Resolve References Batch",
  description:
    "The pages one documentation page references, read from that page's JSON alone (no further requests): each one's title, kind, Apple's summary and, for a symbol, its declaration, grouped by kind. Takes the first maxReferences in the JSON's own order, not by relevance, and leaves out the page's images and other media; filterByType keeps one role or kind.",
  inputSchema: z.object({
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
  }),
  run: handleResolveReferencesBatch,
});
