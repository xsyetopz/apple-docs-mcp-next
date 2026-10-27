import { z } from "zod";

import { handleGetWWDCCodeExamples } from "../wwdc/get-wwdc-code-examples.ts";
import { defineTool } from "./define-tool.ts";

export const getWwdcCodeExamplesTool = defineTool({
  name: "get_wwdc_code_examples",
  title: "Get WWDC Code Examples",
  description:
    "Code examples from WWDC sessions, from bundled data (no network): title, session title, link, year, time and the code. Pass the type or attribute the code contains as framework.",
  openWorld: false,
  inputSchema: z.object({
    framework: z
      .string()
      .optional()
      .describe(
        'Text the code mentions, e.g. "SwiftUI", "@Generable", "LanguageModelSession"',
      ),
    topic: z
      .string()
      .optional()
      .describe(
        'A topic ID from list_wwdc_videos ("swift") or text in a session title or topic name ("animation")',
      ),
    year: z.string().optional().describe('e.g. "2025"'),
    language: z.string().optional().describe('e.g. "swift"'),
    limit: z.number().min(1).max(100).default(10),
  }),
  run: handleGetWWDCCodeExamples,
});
