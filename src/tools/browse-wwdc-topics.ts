import { z } from "zod";

import { handleBrowseWWDCTopics } from "../wwdc/wwdc-handlers.ts";
import { defineTool } from "./define-tool.ts";

export const browseWwdcTopicsTool = defineTool({
  name: "browse_wwdc_topics",
  title: "Browse WWDC Topics",
  description:
    "The WWDC topics in the bundled data (no network), each with its ID, link and session count. With topicId, that topic's sessions instead, filtered by year and capped by limit.",
  inputSchema: z.object({
    topicId: z
      .string()
      .optional()
      .describe(
        'Topic ID to explore. Available IDs: "accessibility-inclusion", "app-services", "app-store-distribution-marketing", "audio-video", "business-education", "design", "developer-tools", "essentials", "graphics-games", "health-fitness", "machine-learning-ai", "maps-location", "photos-camera", "privacy-security", "safari-web", "spatial-computing", "swift", "swiftui-ui-frameworks", "system-services". Leave empty to see all topics with video counts.',
      ),
    includeVideos: z
      .boolean()
      .default(true)
      .describe(
        "List videos in the topic. Set false for topic structure only. Default: true",
      ),
    year: z
      .string()
      .optional()
      .describe(
        "Filter topic videos by year. Only when browsing specific topic.",
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(20)
      .describe("Max videos per topic (default: 20)."),
  }),
  run: handleBrowseWWDCTopics,
});
