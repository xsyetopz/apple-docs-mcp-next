import { z } from "zod";

import { fetchAppleDocJson } from "../docs/doc-fetcher.ts";
import { defineTool } from "./define-tool.ts";

export const getAppleDocContentTool = defineTool({
  name: "get_apple_doc_content",
  title: "Get Apple Doc Content",
  description:
    "Read one Apple documentation page as Markdown: API reference (declaration, overview, code, Topics, Relationships, availability), Human Interface Guidelines, tutorials, sample-code pages, App Store Connect API and Help pages. Its links are site paths on developer.apple.com. For related, similar or platform data use get_api_relations.",
  inputSchema: z.object({
    url: z
      .string()
      .describe(
        "developer.apple.com URL or site path under /documentation/, /design/human-interface-guidelines/, /tutorials/ or /help/app-store-connect/",
      ),
  }),
  run: fetchAppleDocJson,
});
