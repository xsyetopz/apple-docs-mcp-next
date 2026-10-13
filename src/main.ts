#!/usr/bin/env bun
/**
 * The executable: the server on stdio, ended by a signal or by a failure nothing caught.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { logger } from "./core/logger.ts";
import { createServer } from "./server.ts";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection, reason:", reason);
  process.exit(1);
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

try {
  await createServer().connect(new StdioServerTransport());
  logger.info("Apple Developer Docs MCP server running on stdio");
} catch (error) {
  logger.error("Fatal error in main():", error);
  process.exit(1);
}
