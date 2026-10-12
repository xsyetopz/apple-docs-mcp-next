import { z } from "zod";

import { handleGetWWDCCodeExamples } from "../wwdc/wwdc-handlers.ts";
import { defineTool } from "./define-tool.ts";

export const getWwdcCodeExamplesTool = defineTool({
  name: "get_wwdc_code_examples",
  title: "Get WWDC Code Examples",
  description:
    'Code examples from the bundled WWDC sessions (no network): each with its title, its session\'s title, link and year, the time it appears, and the code. framework keeps the examples whose code mentions it, so "SwiftUI" matches any code that imports SwiftUI; topic, language and year filter too.',
  inputSchema: z.object({
    framework: z
      .string()
      .optional()
      .describe(
        'Framework to find examples for. Examples: "SwiftUI", "SwiftData", "RealityKit".',
      ),
    topic: z
      .string()
      .optional()
      .describe(
        'A topic ID from browse_wwdc_topics, such as "swift" or "swiftui-ui-frameworks", keeps that topic\'s sessions; any other text, such as "animation", keeps the sessions whose title or topic names contain it.',
      ),
    year: z
      .string()
      .optional()
      .describe('WWDC year filter ("2025", "2024", etc.).'),
    language: z
      .string()
      .optional()
      .describe(
        'Programming language: "swift", "objc", "javascript", "metal".',
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(30)
      .describe(
        "Max examples (default: 30). Each includes code and source video info.",
      ),
  }),
  run: handleGetWWDCCodeExamples,
});
