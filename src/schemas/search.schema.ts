import { z } from "zod";

export const searchAppleDocsSchema = z.object({
  query: z
    .string()
    .describe(
      'Search query for Apple Developer Documentation. Tips: Use specific API names (e.g., "UIViewController"), framework names (e.g., "SwiftUI"), or technical terms. Avoid generic terms like "how to" or "tutorial". Examples: "NSPredicate", "SwiftUI List", "Core Data migration", "URLSession authentication".',
    ),
  type: z
    .enum(["all", "documentation", "design", "sample", "help"])
    .default("all")
    .describe(
      'Type of content to filter. "all": documentation, design guidelines, sample code projects, and WWDC sessions; "documentation": API references and guides; "design": the Human Interface Guidelines; "sample": sample code projects; "help": App Store Connect Help (product page fields, review, TestFlight, pricing). Default: "all".',
    ),
});
