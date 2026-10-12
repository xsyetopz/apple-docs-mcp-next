import { z } from "zod";

import { handleListWWDCVideos } from "../wwdc/wwdc-handlers.ts";
import { defineTool } from "./define-tool.ts";

export const listWwdcVideosTool = defineTool({
  name: "list_wwdc_videos",
  title: "List WWDC Videos",
  description:
    'WWDC sessions from the data bundled with this server (no network): each one\'s title, its link on developer.apple.com, whether it has a transcript and code, and its topics. year is one year or "all" (list_wwdc_years lists them); topic is a topic ID from browse_wwdc_topics or a word in the title; hasCode keeps the sessions with, or without, code.',
  inputSchema: z.object({
    year: z
      .string()
      .optional()
      .describe(
        'WWDC year ("2025", "2024", etc.) or "all"; list_wwdc_years lists the years held. Example: "2025" for latest.',
      ),
    topic: z
      .string()
      .optional()
      .describe(
        'A topic ID keeps that topic\'s sessions: "accessibility-inclusion", "app-services", "app-store-distribution-marketing", "audio-video", "business-education", "design", "developer-tools", "essentials", "graphics-games", "health-fitness", "machine-learning-ai", "maps-location", "photos-camera", "privacy-security", "safari-web", "spatial-computing", "swift", "swiftui-ui-frameworks", "system-services". Any other text keeps the sessions whose title or topic names contain it.',
      ),
    hasCode: z
      .boolean()
      .optional()
      .describe(
        "Filter by code availability. true = sessions with code, false = without code. Leave empty for all.",
      ),
    limit: z
      .number()
      .min(1)
      .max(200)
      .default(50)
      .describe(
        "Max videos to show (default: 50). Videos include title, duration, and content indicators.",
      ),
  }),
  run: handleListWWDCVideos,
});
