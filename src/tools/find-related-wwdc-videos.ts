import { z } from "zod";

import { handleFindRelatedWWDCVideos } from "../wwdc/find-related-wwdc-videos.ts";
import { defineTool } from "./define-tool.ts";

export const findRelatedWwdcVideosTool = defineTool({
  name: "find_related_wwdc_videos",
  title: "Find Related WWDC Videos",
  description:
    "Sessions related to one WWDC session, from bundled data (no network): first those Apple lists on its page, then sessions sharing its topics, optionally the same year. Each with year, link, duration, why it is related and whether it has transcript and code.",
  openWorld: false,
  inputSchema: z.object({
    videoId: z.string().describe('Source session ID, e.g. "10101"'),
    year: z.string().describe('Source session year, e.g. "2025"'),
    includeExplicitRelated: z
      .boolean()
      .default(true)
      .describe("Apple's own list: prerequisites, follow-ups"),
    includeTopicRelated: z.boolean().default(true),
    includeYearRelated: z.boolean().default(false),
    limit: z.number().min(1).max(50).default(15),
  }),
  run: handleFindRelatedWWDCVideos,
});
