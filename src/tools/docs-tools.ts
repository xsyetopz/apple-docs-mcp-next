/** The tools that read Apple's documentation, in the order a client lists them */
import type { Tool } from "./define-tool.ts";
import { getApiRelationsTool } from "./get-api-relations.ts";
import { getAppleDocContentTool } from "./get-apple-doc-content.ts";
import { getDocumentationUpdatesTool } from "./get-documentation-updates.ts";
import { getSampleCodeTool } from "./get-sample-code.ts";
import { getTechnologyOverviewsTool } from "./get-technology-overviews.ts";
import { listTechnologiesTool } from "./list-technologies.ts";
import { searchAppleDocsTool } from "./search-apple-docs.ts";
import { searchDocsMapTool } from "./search-docs-map.ts";
import { searchFrameworkSymbolsTool } from "./search-framework-symbols.ts";

export const docsTools: readonly Tool[] = [
	searchAppleDocsTool,
	getAppleDocContentTool,
	listTechnologiesTool,
	searchFrameworkSymbolsTool,
	searchDocsMapTool,
	getApiRelationsTool,
	getDocumentationUpdatesTool,
	getTechnologyOverviewsTool,
	getSampleCodeTool,
];
