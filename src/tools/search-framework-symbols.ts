import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { searchFrameworkSymbols } from "../docs/search-framework-symbols.ts";
import { defineTool } from "./define-tool.ts";

export const searchFrameworkSymbolsTool = defineTool({
  name: "search_framework_symbols",
  title: "Search Framework Symbols",
  description:
    'The symbols in one framework\'s navigator index: each one\'s name, link and kind, without summaries. framework is the last segment of the framework\'s documentation link ("swiftui", "storekit"); symbolType keeps one kind; namePattern is a wildcard such as "*View" or "UI*", in any case; nested symbols count toward limit. Read a symbol with get_apple_doc_content.',
  inputSchema: z.object({
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
  }),
  run: searchFrameworkSymbols,
});
