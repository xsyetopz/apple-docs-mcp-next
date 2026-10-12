import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { handleGetSampleCode } from "../docs/get-sample-code.ts";
import { defineTool } from "./define-tool.ts";

export const getSampleCodeTool = defineTool({
  name: "get_sample_code",
  title: "Get Sample Code",
  description:
    "Apple's sample-code library: project titles with links and Apple's one-line summaries, grouped by framework; read a project's page, with its Download link, with get_apple_doc_content. framework matches the project's framework in any spelling (\"storekit\", \"Store Kit\"); searchQuery matches titles first, then frameworks, paths and summaries.",
  inputSchema: z.object({
    framework: z
      .string()
      .optional()
      .describe(
        'Framework filter (case-insensitive). Examples: "SwiftUI", "ARKit", "CoreML". Note: Some samples are under generic categories - use searchQuery for better results.',
      ),
    beta: z
      .enum(["include", "exclude", "only"])
      .default("include")
      .describe(
        'Beta samples: "include" = all, "exclude" = stable only, "only" = beta only. Default: "include"',
      ),
    searchQuery: z
      .string()
      .optional()
      .describe(
        'Search keywords. Most effective approach. Examples: "animation", "camera", "machine learning", "widgets".',
      ),
    limit: z
      .number()
      .min(1)
      .max(API_LIMITS.MAX_SAMPLE_CODE_LIMIT)
      .default(API_LIMITS.DEFAULT_SAMPLE_CODE_LIMIT)
      .describe("Max results (default: 50)."),
  }),
  run: handleGetSampleCode,
});
