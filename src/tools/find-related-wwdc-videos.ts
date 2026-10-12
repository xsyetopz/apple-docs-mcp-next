import { z } from "zod";

import { handleFindRelatedWWDCVideos } from "../wwdc/find-related-wwdc-videos.ts";
import { defineTool } from "./define-tool.ts";

export const findRelatedWwdcVideosTool = defineTool({
  name: "find_related_wwdc_videos",
  title: "Find Related WWDC Videos",
  description:
    "Sessions related to one WWDC session, from the bundled data (no network): first those Apple lists as related on the session's page, then sessions sharing its topics and, with includeYearRelated, sessions of the same year; each with its year, link, topics and whether it has a transcript and code.",
  inputSchema: z.object({
    videoId: z
      .string()
      .describe('Source video ID. Example: "10101" for keynote.'),
    year: z.string().describe('Source video year. Example: "2025"'),
    includeExplicitRelated: z
      .boolean()
      .default(true)
      .describe(
        "Include Apple's recommended related videos. Usually prerequisites or follow-ups. Default: true",
      ),
    includeTopicRelated: z
      .boolean()
      .default(true)
      .describe(
        "Include videos from same topic categories. Good for comprehensive learning. Default: true",
      ),
    includeYearRelated: z
      .boolean()
      .default(false)
      .describe("Include other videos from same WWDC. Default: false"),
    limit: z
      .number()
      .min(1)
      .max(50)
      .default(15)
      .describe("Max related videos (default: 15)."),
  }),
  run: handleFindRelatedWWDCVideos,
});
