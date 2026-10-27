import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { handleListTechnologies } from "../docs/list-technologies.ts";
import { defineTool } from "./define-tool.ts";

export const listTechnologiesTool = defineTool({
  name: "list_technologies",
  title: "List Technologies",
  description:
    'Apple\'s frameworks and technologies by category, with framework IDs and languages; tags with category. The last segment of a link ("swiftui", "storekit") is the framework ID that search_framework_symbols takes.',
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe(
        'Category name or technology tag, in any case: "App frameworks", "Graphics and games", "App services", "Media", "Machine learning" (finds Core ML, Vision)',
      ),
    language: z.enum(["swift", "occ"]).optional(),
    includeBeta: z.boolean().default(true),
    limit: z
      .number()
      .int()
      .positive()
      .max(API_LIMITS.MAX_TECHNOLOGIES_LIMIT)
      .default(API_LIMITS.DEFAULT_TECHNOLOGIES_LIMIT)
      .describe("Per category"),
  }),
  run: handleListTechnologies,
});
