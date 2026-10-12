import { z } from "zod";

export const getPlatformCompatibilitySchema = z.object({
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
});
