/**
 * The MCP side of a tool: its listing, its arguments checked against its zod schema by the SDK, and its answer, the
 * use case's Markdown or, when the use case throws, one error result with the failure's suggestions. An answer too
 * long for one result comes in parts, which the `part` argument every tool takes selects.
 */
import type { CallToolResult, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { AppError, classifyError } from "../core/errors.ts";
import { answerPart } from "./answer-parts.ts";

export interface ToolSpec<Input extends z.ZodObject> {
	name: string;
	title: string;
	description: string;
	inputSchema: Input;
	/** Whether the tool calls developer.apple.com (the MCP `openWorldHint`); false for bundled data */
	openWorld?: boolean;
	run: (input: z.output<Input>) => Promise<string>;
}

/** Registers one tool on a server */
export type Tool = (server: McpServer) => void;

const parts = z.object({
	part: z
		.number()
		.int()
		.min(1)
		.default(1)
		.describe(
			"Which part of a long answer to return. An answer in parts says how many it has.",
		),
});

export const defineTool =
	<Input extends z.ZodObject>(spec: ToolSpec<Input>): Tool =>
	(server) => {
		server.registerTool<z.ZodObject, z.ZodObject>(
			spec.name,
			{
				title: spec.title,
				description: spec.description,
				inputSchema: spec.inputSchema.extend(parts.shape),
				annotations: {
					readOnlyHint: true,
					openWorldHint: spec.openWorld ?? true,
				},
			},
			// The SDK's types cannot name the arguments of a generic schema, so the tool's own schema reads them again.
			(input) =>
				call(spec, spec.inputSchema.parse(input), parts.parse(input).part),
		);
	};

const call = async <Input extends z.ZodObject>(
	spec: ToolSpec<Input>,
	input: z.output<Input>,
	part: number,
): Promise<CallToolResult> => {
	try {
		const text = answerPart(spec.name, await spec.run(input), part);
		return { content: [{ type: "text", text }] };
	} catch (error) {
		const failure =
			error instanceof AppError ? error : classifyError(error, spec.name);
		return {
			content: [
				{ type: "text", text: answerPart(spec.name, errorText(failure), 1) },
			],
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
