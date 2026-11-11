/** The tools that read the bundled WWDC sessions, in the order a client lists them */
import type { Tool } from "./define-tool.ts";
import { findRelatedWwdcVideosTool } from "./find-related-wwdc-videos.ts";
import { getWwdcCodeExamplesTool } from "./get-wwdc-code-examples.ts";
import { getWwdcVideoTool } from "./get-wwdc-video.ts";
import { listWwdcVideosTool } from "./list-wwdc-videos.ts";
import { searchWwdcContentTool } from "./search-wwdc-content.ts";

export const wwdcTools: readonly Tool[] = [
	listWwdcVideosTool,
	searchWwdcContentTool,
	getWwdcVideoTool,
	getWwdcCodeExamplesTool,
	findRelatedWwdcVideosTool,
];
