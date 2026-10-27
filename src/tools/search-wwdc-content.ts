import { z } from "zod";

import { handleSearchWWDCContent } from "../wwdc/search-wwdc-content.ts";
import { defineTool } from "./define-tool.ts";

export const searchWwdcContentTool = defineTool({
  name: "search_wwdc_content",
  title: "Search WWDC Content",
  description:
    "Full-text search of WWDC session transcripts and code, from bundled data (no network). Per matching session, most matches first: title, link, year and up to 3 matching paragraphs or code snippets with their time.",
  openWorld: false,
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe('Terms, e.g. "async await", "@Observable"'),
    searchIn: z.enum(["transcript", "code", "both"]).default("both"),
    year: z.string().optional().describe('e.g. "2025"; empty for all years'),
    language: z
      .string()
      .optional()
      .describe('Code language, e.g. "swift"; code search only'),
    limit: z.number().min(1).max(100).default(10),
  }),
  run: handleSearchWWDCContent,
});
