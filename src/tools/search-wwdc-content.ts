import { z } from "zod";

import { handleSearchWWDCContent } from "../wwdc/wwdc-handlers.ts";
import { defineTool } from "./define-tool.ts";

export const searchWwdcContentTool = defineTool({
  name: "search_wwdc_content",
  title: "Search WWDC Content",
  description:
    "Full-text search of the bundled WWDC transcripts and code (no network). For each session that matches, most matches first: its title, link and year, and up to 3 matches, each a transcript paragraph or the code lines around the match, with the code example's title and the time it appears. searchIn picks transcripts, code or both; language filters the code.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe(
        'Search terms. Examples: "async await", "@Observable", "Vision Pro", "performance optimization".',
      ),
    searchIn: z
      .enum(["transcript", "code", "both"])
      .default("both")
      .describe(
        'Search scope. "transcript" = spoken content, "code" = code examples only, "both" = everything. Default: "both"',
      ),
    year: z
      .string()
      .optional()
      .describe(
        'Limit to specific year ("2025", "2024", etc.). Leave empty for all years.',
      ),
    language: z
      .string()
      .optional()
      .describe(
        'Code language filter ("swift", "objc", "javascript"). Only for code search.',
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Max results (default: 20). Results include context snippets."),
  }),
  run: handleSearchWWDCContent,
});
