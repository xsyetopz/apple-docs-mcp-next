/**
 * Logs to stderr: on the stdio transport, stdout carries the JSON-RPC stream, so a line there breaks the client.
 * Debug and info lines show only with `MCP_DEBUG=true`.
 */
const verbose = process.env["MCP_DEBUG"] === "true";

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (verbose) {
      console.error(`[DEBUG] ${message}`, ...args);
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (verbose) {
      console.error(`[INFO] ${message}`, ...args);
    }
  },

  warn(message: string, ...args: unknown[]): void {
    console.error(`[WARN] ${message}`, ...args);
  },

  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`);
    if (error) {
      console.error(error);
    }
  },
};
