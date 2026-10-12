import { z } from "zod";
import { API_LIMITS } from "../utils/constants.ts";

export const searchFrameworkSymbolsSchema = z.object({
  framework: z
    .string()
    .describe(
      'Framework identifier in lowercase. Common: "uikit", "swiftui", "foundation", "combine", "coredata". Get exact names from list_technologies. Example: "swiftui" for SwiftUI framework.',
    ),
  symbolType: z
    .enum([
      "all",
      "class",
      "struct",
      "enum",
      "protocol",
      "method",
      "property",
      "init",
      "func",
      "var",
      "let",
      "typealias",
    ])
    .default("all")
    .describe(
      'Filter by symbol type. Use "class" for UIViewController subclasses, "protocol" for delegates, "struct" for value types. Default: "all" shows everything.',
    ),
  namePattern: z
    .string()
    .optional()
    .describe(
      'Filter by name pattern. Use "*View" for all views, "UI*" for UI-prefixed symbols, "*Delegate" for delegates. Any case. Leave empty for all symbols.',
    ),
  language: z
    .enum(["swift", "occ"])
    .default("swift")
    .describe(
      'Language preference. Some APIs differ between Swift and Objective-C. Default: "swift"',
    ),
  limit: z
    .number()
    .min(1)
    .max(API_LIMITS.MAX_FRAMEWORK_SYMBOLS_LIMIT)
    .default(API_LIMITS.DEFAULT_FRAMEWORK_SYMBOLS_LIMIT)
    .describe(
      "Results limit (default: 50, max: 200). Includes nested symbols.",
    ),
});
