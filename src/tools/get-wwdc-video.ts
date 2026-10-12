import { z } from "zod";

import { handleGetWWDCVideo } from "../wwdc/get-wwdc-video.ts";
import { defineTool } from "./define-tool.ts";

export const getWwdcVideoTool = defineTool({
  name: "get_wwdc_video",
  title: "Get WWDC Video",
  description:
    "One WWDC session from the bundled data, as text (no network): title, year and topics; its links, including the HD and SD .mp4 downloads and the documentation it covers; the full transcript as plain text, without timestamps; every code example with the time it appears; and related sessions. Transcripts run to tens of KB: includeTranscript false leaves it out.",
  inputSchema: z.object({
    year: z.string().describe('WWDC year. Example: "2025"'),
    videoId: z
      .string()
      .describe(
        'Session ID. Example: "10101" for keynote, "238" for session 238.',
      ),
    includeTranscript: z
      .boolean()
      .default(true)
      .describe(
        "Include the full transcript, as plain text without timestamps. Default: true",
      ),
    includeCode: z
      .boolean()
      .default(true)
      .describe("Include all code examples from the session. Default: true"),
  }),
  run: handleGetWWDCVideo,
});
