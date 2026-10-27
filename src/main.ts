#!/usr/bin/env bun
/**
 * The executable: the server on stdio, ended by a signal or by a failure nothing caught. `serveStdio` picks the protocol
 * era from the first message: `server/discover` serves 2026-07-28, `initialize` serves an older client.
 */
import { serveStdio } from "@modelcontextprotocol/server/stdio";

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
  serveStdio(createServer);
  logger.info("Apple Developer Docs MCP server running on stdio");
} catch (error) {
  logger.error("Fatal error in main():", error);
  process.exit(1);
}
