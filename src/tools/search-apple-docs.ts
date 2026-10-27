import { z } from "zod";

import { searchAppleDocs } from "../docs/search-apple-docs.ts";
import { defineTool } from "./define-tool.ts";

export const searchAppleDocsTool = defineTool({
  name: "search_apple_docs",
  title: "Search Apple Docs",
  description:
    'Search developer.apple.com: documentation, Human Interface Guidelines, sample code, App Store Connect Help and up to 5 WWDC sessions. Returns links with one-line summaries, not content; read one with get_apple_doc_content. Searches run one at a time, 15 s apart; "all" sends two.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'API names or technical terms, e.g. "SwiftUI List", "URLSession authentication"; not "how to"',
      ),
    type: z
      .enum(["all", "documentation", "design", "sample", "help"])
      .default("all")
      .describe(
        '"design" is the Human Interface Guidelines, "help" App Store Connect Help',
      ),
  }),
  run: searchAppleDocs,
});
