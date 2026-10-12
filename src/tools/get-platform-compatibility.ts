import { z } from "zod";

import { handleGetPlatformCompatibility } from "../docs/get-platform-compatibility.ts";
import { defineTool } from "./define-tool.ts";

export const getPlatformCompatibilityTool = defineTool({
  name: "get_platform_compatibility",
  title: "Get Platform Compatibility",
  description:
    "Where one API is available, from its page's JSON: each platform with the version that introduced it and the version that deprecated it, with Apple's note, and the minimum versions; an API deprecated on every platform it supports is flagged as such. compareMode \"framework\" runs the same check with related APIs included.",
  inputSchema: z.object({
    apiUrl: z
      .string()
      .describe(
        'API URL to check compatibility. Example: "https://developer.apple.com/documentation/swiftui/list"',
      ),
    compareMode: z
      .enum(["single", "framework"])
      .default("single")
      .describe(
        '"single" checks the API; "framework" runs the same check with related APIs included. Default: "single"',
      ),
    includeRelated: z
      .boolean()
      .default(false)
      .describe(
        "Also check related APIs' compatibility. Useful for finding platform-specific alternatives. Default: false",
      ),
  }),
  run: handleGetPlatformCompatibility,
});
