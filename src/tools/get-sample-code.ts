import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { handleGetSampleCode } from "../docs/get-sample-code.ts";
import { defineTool } from "./define-tool.ts";

export const getSampleCodeTool = defineTool({
  name: "get_sample_code",
  title: "Get Sample Code",
  description:
    "Apple's sample-code projects: titles, links and one-line summaries, grouped by framework. Read a project's page, with its Download link, with get_apple_doc_content.",
  inputSchema: z.object({
    framework: z
      .string()
      .optional()
      .describe(
        'Framework in any spelling, e.g. "storekit" or "Store Kit"; some samples sit under generic groups, so searchQuery finds more',
      ),
    beta: z.enum(["include", "exclude", "only"]).default("include"),
    searchQuery: z
      .string()
      .optional()
      .describe(
        'Matches titles first, then frameworks, paths and summaries, e.g. "camera"',
      ),
    limit: z
      .number()
      .min(1)
      .max(API_LIMITS.MAX_SAMPLE_CODE_LIMIT)
      .default(API_LIMITS.DEFAULT_SAMPLE_CODE_LIMIT),
  }),
  run: handleGetSampleCode,
});
