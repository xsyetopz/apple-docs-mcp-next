import { z } from "zod";
import { API_LIMITS } from "../core/constants.ts";

import { searchFrameworkSymbols } from "../docs/search-framework-symbols.ts";
import { defineTool } from "./define-tool.ts";

export const searchFrameworkSymbolsTool = defineTool({
  name: "search_framework_symbols",
  title: "Search Framework Symbols",
  description:
    "List the symbols of one framework by name pattern and kind: name, link and kind, no summaries. Read a symbol with get_apple_doc_content.",
  inputSchema: z.object({
    framework: z
      .string()
      .describe(
        'Lowercase framework ID, the last segment of its documentation link: "swiftui", "storekit" (see list_technologies)',
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
      .default("all"),
    namePattern: z
      .string()
      .optional()
      .describe('Wildcard in any case, e.g. "*View", "UI*", "*feedback*"'),
    language: z.enum(["swift", "occ"]).default("swift"),
    limit: z
      .number()
      .min(1)
      .max(API_LIMITS.MAX_FRAMEWORK_SYMBOLS_LIMIT)
      .default(API_LIMITS.DEFAULT_FRAMEWORK_SYMBOLS_LIMIT)
      .describe("Nested symbols count"),
  }),
  run: searchFrameworkSymbols,
});
