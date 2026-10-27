import { z } from "zod";

import { handleSearchDocsMap } from "../docs/search-docs-map.ts";
import { defineTool } from "./define-tool.ts";

export const searchDocsMapTool = defineTool({
  name: "search_docs_map",
  title: "Search Docs Map",
  description:
    "Find a documentation or Human Interface Guidelines page by the text its title contains, from the local docs map (no network): title, kind, technology and link, shortest titles first. Read a page with get_apple_doc_content.",
  openWorld: false,
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe(
        'Title text, in any case, taken as typed: a name ("accessibilityInputLabels(_:)"), part of one ("inputlabels") or a word ("gauge")',
      ),
    technology: z
      .array(z.string().min(1))
      .optional()
      .describe('Technologies as the results show them, e.g. ["SwiftUI"]'),
    limit: z.number().min(1).max(100).default(10),
  }),
  run: handleSearchDocsMap,
});
