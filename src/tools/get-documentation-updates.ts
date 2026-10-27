import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { handleGetDocumentationUpdates } from "../docs/get-documentation-updates.ts";
import { defineTool } from "./define-tool.ts";

export const getDocumentationUpdatesTool = defineTool({
  name: "get_documentation_updates",
  title: "Get Documentation Updates",
  description:
    "Links from Apple's Updates page with one-line summaries: OS, Xcode and Safari release notes, each framework's \"updates\" page, and the What's new page of each WWDC. Links only; read one with get_apple_doc_content. For WWDC sessions use the WWDC tools.",
  inputSchema: z.object({
    category: z
      .enum(["all", "wwdc", "technology", "release-notes"])
      .default("all"),
    technology: z
      .string()
      .optional()
      .describe('Framework, e.g. "SwiftUI" (names from list_technologies)'),
    year: z.string().optional().describe('WWDC year, e.g. "2025"; wwdc only'),
    searchQuery: z.string().optional().describe('Keywords, e.g. "widgets"'),
    includeBeta: z.boolean().default(true),
    limit: z
      .number()
      .min(1)
      .max(API_LIMITS.MAX_DOCUMENTATION_UPDATES_LIMIT)
      .default(API_LIMITS.DEFAULT_DOCUMENTATION_UPDATES_LIMIT),
  }),
  run: handleGetDocumentationUpdates,
});
