import { z } from "zod";

export const searchDocsMapSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Text the title contains, in any case and taken as typed: a name ("accessibilityInputLabels(_:)"), part of one ("inputlabels") or a word ("gauge").',
    ),
  technology: z
    .array(z.string().min(1))
    .optional()
    .describe(
      'Keep only the pages of these technologies, by the name the results show ("SwiftUI", "UIKit", "Human Interface Guidelines"), in any case.',
    ),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(10)
    .describe("Max results, shortest titles first (default: 10)."),
});
