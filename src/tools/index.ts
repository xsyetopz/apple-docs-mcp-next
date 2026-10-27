/** Every tool the server offers, in the order a client lists them */
import { browseWwdcTopicsTool } from "./browse-wwdc-topics.ts";
import type { Tool } from "./define-tool.ts";
import { findRelatedWwdcVideosTool } from "./find-related-wwdc-videos.ts";
import { getApiRelationsTool } from "./get-api-relations.ts";
import { getAppleDocContentTool } from "./get-apple-doc-content.ts";
import { getDocumentationUpdatesTool } from "./get-documentation-updates.ts";
import { getSampleCodeTool } from "./get-sample-code.ts";
import { getTechnologyOverviewsTool } from "./get-technology-overviews.ts";
import { getWwdcCodeExamplesTool } from "./get-wwdc-code-examples.ts";
import { getWwdcVideoTool } from "./get-wwdc-video.ts";
import { listTechnologiesTool } from "./list-technologies.ts";
import { listWwdcVideosTool } from "./list-wwdc-videos.ts";
import { listWwdcYearsTool } from "./list-wwdc-years.ts";
import { searchAppleDocsTool } from "./search-apple-docs.ts";
import { searchDocsMapTool } from "./search-docs-map.ts";
import { searchFrameworkSymbolsTool } from "./search-framework-symbols.ts";
import { searchWwdcContentTool } from "./search-wwdc-content.ts";

export const tools: readonly Tool[] = [
  searchAppleDocsTool,
  getAppleDocContentTool,
  listTechnologiesTool,
  searchFrameworkSymbolsTool,
  searchDocsMapTool,
  getApiRelationsTool,
  getDocumentationUpdatesTool,
  getTechnologyOverviewsTool,
  getSampleCodeTool,
  listWwdcVideosTool,
  searchWwdcContentTool,
  getWwdcVideoTool,
  getWwdcCodeExamplesTool,
  browseWwdcTopicsTool,
  findRelatedWwdcVideosTool,
  listWwdcYearsTool,
];
