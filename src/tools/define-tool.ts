/**
 * The MCP side of a tool: its listing, its arguments checked against its zod schema by the SDK, and its answer, the
 * use case's Markdown or, when the use case throws, one error result with the failure's suggestions.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

import { AppError, classifyError } from "../core/errors.ts";

export interface ToolSpec<Input extends z.ZodObject> {
  name: string;
  title: string;
  description: string;
  inputSchema: Input;
  run: (input: z.output<Input>) => Promise<string>;
}

/** Registers one tool on a server */
export type Tool = (server: McpServer) => void;

export const defineTool = <Input extends z.ZodObject>(
  spec: ToolSpec<Input>,
): Tool => {
  return (server) => {
    server.registerTool<z.ZodObject, z.ZodObject>(
      spec.name,
      {
        title: spec.title,
        description: spec.description,
        inputSchema: spec.inputSchema,
        annotations: { readOnlyHint: true },
      },
      // The SDK parses the arguments with `spec.inputSchema` before this runs; its types cannot say so for a generic schema.
      (input) => call(spec, input as z.output<Input>),
    );
  };
};

const call = async <Input extends z.ZodObject>(
  spec: ToolSpec<Input>,
  input: z.output<Input>,
): Promise<CallToolResult> => {
  try {
    return { content: [{ type: "text", text: await spec.run(input) }] };
  } catch (error) {
    const failure =
      error instanceof AppError ? error : classifyError(error, spec.name);
    return {
      content: [{ type: "text", text: errorText(failure) }],
      isError: true,
    };
  }
};

const errorText = ({ message, suggestions }: AppError): string => {
  if (suggestions.length === 0) {
    return `Error: ${message}`;
  }
  return `Error: ${message}\n\nSuggestions:\n${suggestions.map((suggestion) => `• ${suggestion}`).join("\n")}`;
};
