/** Every tool the server offers, in the order a client lists them */
import type { Tool } from "./define-tool.ts";
import { docsTools } from "./docs-tools.ts";
import { wwdcTools } from "./wwdc-tools.ts";

export const tools: readonly Tool[] = [...docsTools, ...wwdcTools];
