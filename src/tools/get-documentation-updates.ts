import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { handleGetDocumentationUpdates } from "../docs/get-documentation-updates.ts";
import { defineTool } from "./define-tool.ts";

export const getDocumentationUpdatesTool = defineTool({
  name: "get_documentation_updates",
  title: "Get Documentation Updates",
  description:
    "Links from Apple's Updates page, each with Apple's one-line summary: the release notes of each OS, Xcode and Safari; each framework's updates page (\"SwiftUI updates\"); and the What's new page of each past WWDC. Returns the links, not the changes; read one with get_apple_doc_content. For WWDC sessions use the WWDC tools.",
  inputSchema: z.object({
    category: z
      .enum(["all", "wwdc", "technology", "release-notes"])
      .default("all")
      .describe(
        'Update type filter. "wwdc": the What\'s new page of each past WWDC; "technology": each framework\'s updates page; "release-notes": the release notes of each OS, Xcode and Safari. Default: "all"',
      ),
    technology: z
      .string()
      .optional()
      .describe(
        'Filter by framework, in any case. Examples: "SwiftUI", "UIKit", "ARKit". Get names from list_technologies.',
      ),
    year: z
      .string()
      .optional()
      .describe(
        'WWDC year filter ("2025", "2024", etc.). Only for wwdc category.',
      ),
    searchQuery: z
      .string()
      .optional()
      .describe(
        'Search keywords. Examples: "async", "performance", "widgets". Case-insensitive.',
      ),
    includeBeta: z
      .boolean()
      .default(true)
      .describe("Include beta/preview features. Default: true"),
    limit: z
      .number()
      .min(1)
      .max(API_LIMITS.MAX_DOCUMENTATION_UPDATES_LIMIT)
      .default(API_LIMITS.DEFAULT_DOCUMENTATION_UPDATES_LIMIT)
      .describe("Max results (default: 50). Sorted by relevance and date."),
  }),
  run: handleGetDocumentationUpdates,
});
