import { z } from "zod";

import { searchAppleDocs } from "../docs/search-apple-docs.ts";
import { defineTool } from "./define-tool.ts";

export const searchAppleDocsTool = defineTool({
  name: "search_apple_docs",
  title: "Search Apple Docs",
  description:
    'Search developer.apple.com the way its search page does (Apple\'s search API). Returns links, not content: each result\'s title, framework, type and Apple\'s one-line summary, grouped by section. type "all" (the default) covers documentation, the Human Interface Guidelines, sample code and App Store Connect Help, plus a WWDC Sessions section of up to 5 sessions, each with the get_wwdc_video call that reads it; "documentation", "design", "sample" or "help" (App Store Connect Help) searches only that. Read a result with get_apple_doc_content. Searches go out one at a time, 15 s apart, as Apple answers quicker ones with no results; "all" sends two.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Search query for Apple Developer Documentation. Tips: Use specific API names (e.g., "UIViewController"), framework names (e.g., "SwiftUI"), or technical terms. Avoid generic terms like "how to" or "tutorial". Examples: "NSPredicate", "SwiftUI List", "Core Data migration", "URLSession authentication".',
      ),
    type: z
      .enum(["all", "documentation", "design", "sample", "help"])
      .default("all")
      .describe(
        'Type of content to filter. "all": documentation, design guidelines, sample code projects, and WWDC sessions; "documentation": API references and guides; "design": the Human Interface Guidelines; "sample": sample code projects; "help": App Store Connect Help (product page fields, review, TestFlight, pricing). Default: "all".',
      ),
  }),
  run: searchAppleDocs,
});
