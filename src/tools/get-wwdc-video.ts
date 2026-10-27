import { z } from "zod";

import { handleGetWWDCVideo } from "../wwdc/get-wwdc-video.ts";
import { defineTool } from "./define-tool.ts";

export const getWwdcVideoTool = defineTool({
  name: "get_wwdc_video",
  title: "Get WWDC Video",
  description:
    "Read one WWDC session from bundled data (no network): title, topics, links (HD .mp4 download, covered documentation), code examples with their times and related sessions; the plain-text transcript only with includeTranscript (tens of KB).",
  openWorld: false,
  inputSchema: z.object({
    year: z.string().describe('e.g. "2025"'),
    videoId: z
      .string()
      .describe('Session ID, e.g. "238"; "10101" is the keynote'),
    includeTranscript: z.boolean().default(false),
    includeCode: z.boolean().default(true),
  }),
  run: handleGetWWDCVideo,
});
