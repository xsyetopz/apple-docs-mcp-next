import { z } from "zod";

import { handleSearchDocsMap } from "../docs/search-docs-map.ts";
import { defineTool } from "./define-tool.ts";

export const searchDocsMapTool = defineTool({
  name: "search_docs_map",
  title: "Search Docs Map",
  description:
    "Every page of Apple's documentation and the Human Interface Guidelines whose title contains query, in any case and as typed (no pattern syntax), from the docs map on disk (api-map/apple-docs-map.tsv, built by scripts/build-docs-map.ts; no network): each one's title, kind, technology and link, shortest titles first; technology keeps one or more frameworks. Read a page with get_apple_doc_content.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe(
        'Text the title contains, in any case and taken as typed: a name ("accessibilityInputLabels(_:)"), part of one ("inputlabels") or a word ("gauge").',
      ),
    technology: z
      .array(z.string().min(1))
      .optional()
      .describe(
        'Keep only the pages of these technologies, by the name the results show ("SwiftUI", "UIKit", "Human Interface Guidelines"), in any case.',
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(10)
      .describe("Max results, shortest titles first (default: 10)."),
  }),
  run: handleSearchDocsMap,
});
