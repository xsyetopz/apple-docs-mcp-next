import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { handleListTechnologies } from "../docs/list-technologies.ts";
import { defineTool } from "./define-tool.ts";

export const listTechnologiesTool = defineTool({
  name: "list_technologies",
  title: "List Technologies",
  description:
    'Apple\'s technology index: every framework and technology with its link, its languages (swift, occ, data) and its categories, alphabetical within each category. category keeps the categories whose name contains it, or else the technologies with a tag that contains it ("Machine learning": Core ML, Create ML, Vision…), in any case; a beta technology is marked (Beta). The last segment of a technology\'s link ("swiftui", "storekit") is the framework search_framework_symbols takes.',
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe(
        'Keeps the categories whose name contains this or, failing that, the technologies with a tag that contains it (the Categories line of each), in any case: "Machine learning" finds Core ML, Create ML and Vision. Popular: "App frameworks" (SwiftUI, UIKit), "Graphics and games" (Metal, SpriteKit), "App services" (CloudKit, StoreKit), "Media" (AVFoundation), "System" (Foundation). Leave empty to see all categories.',
      ),
    language: z
      .enum(["swift", "occ"])
      .optional()
      .describe(
        'Filter by language support. "swift" for Swift-compatible frameworks, "occ" for Objective-C. Leave empty for all.',
      ),
    includeBeta: z
      .boolean()
      .default(true)
      .describe(
        "Include beta/preview technologies. Set to false to see only stable frameworks. Default: true",
      ),
    limit: z
      .number()
      .int()
      .positive()
      .max(API_LIMITS.MAX_TECHNOLOGIES_LIMIT)
      .default(API_LIMITS.DEFAULT_TECHNOLOGIES_LIMIT)
      .describe(
        "Max results per category. Useful for quick overviews. Default: 200",
      ),
  }),
  run: handleListTechnologies,
});
