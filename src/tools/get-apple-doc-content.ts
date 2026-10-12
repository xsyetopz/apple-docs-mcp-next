import { z } from "zod";

import { fetchAppleDocJson } from "../docs/doc-fetcher.ts";
import { defineTool } from "./define-tool.ts";

export const getAppleDocContentTool = defineTool({
  name: "get_apple_doc_content",
  title: "Get Apple Doc Content",
  description:
    "One page of Apple's documentation as Markdown, rendered from the page's JSON, the data developer.apple.com builds the page from, in its Swift version: the symbol's kind, Apple's summary, its declaration, the overview with its code listings, tables, notes and images (with Apple's alt text), the Topics groups with each group's description and each member's declaration and summary, the Relationships (conforms to, inherits from, inherited by, conforming types), platform availability and the See Also links; a sample page's Download; a tutorial overview's volumes and chapters, each tutorial with its summary, and a tutorial's steps with the code file after each and its project files; a web-service page's (App Store Connect API, App Store Server API and the like) URL, parameters, body, response codes, properties and possible values. An App Store Connect Help page comes as its article converted to Markdown. Links in the text come as links. The include\u2026 flags append related APIs, referenced types, similar APIs and a platform analysis, read from the page's JSON.",
  inputSchema: z.object({
    url: z
      .string()
      .describe(
        'Full URL of the Apple Developer Documentation page. Must start with https://developer.apple.com/documentation/, https://developer.apple.com/design/human-interface-guidelines/, https://developer.apple.com/tutorials/ or https://developer.apple.com/help/app-store-connect/. Example: "https://developer.apple.com/documentation/uikit/uiviewcontroller"',
      ),
    includeRelatedApis: z
      .boolean()
      .default(false)
      .describe(
        "Include inheritance hierarchy and protocol conformances. Useful for understanding API relationships. Default: false",
      ),
    includeReferences: z
      .boolean()
      .default(false)
      .describe(
        "Resolve and include all referenced types and APIs. Helps understand dependencies. Default: false",
      ),
    includeSimilarApis: z
      .boolean()
      .default(false)
      .describe(
        "Discover APIs with similar functionality. Great for finding alternatives. Default: false",
      ),
    includePlatformAnalysis: z
      .boolean()
      .default(false)
      .describe(
        "Analyze platform availability and version requirements. Essential for cross-platform development. Default: false",
      ),
  }),
  run: fetchAppleDocJson,
});
