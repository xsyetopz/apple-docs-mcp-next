import { z } from "zod";

import { handleListWWDCVideos } from "../wwdc/list-wwdc-videos.ts";
import { defineTool } from "./define-tool.ts";

export const listWwdcVideosTool = defineTool({
  name: "list_wwdc_videos",
  title: "List WWDC Videos",
  description:
    "List WWDC sessions from bundled data (no network): title, link, topics, transcript and code flags. With no year, topic or hasCode it returns the index instead: years with session counts and topics with IDs.",
  openWorld: false,
  inputSchema: z.object({
    year: z.string().optional().describe('"2025" or "all"'),
    topic: z
      .string()
      .optional()
      .describe(
        'Topic ID from the index, e.g. "swiftui-ui-frameworks"; other text matches title or topic names',
      ),
    hasCode: z.boolean().optional(),
    limit: z.number().min(1).max(200).default(30),
  }),
  run: handleListWWDCVideos,
});
