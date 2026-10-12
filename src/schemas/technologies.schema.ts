import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

export const listTechnologiesSchema = z.object({
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
});
