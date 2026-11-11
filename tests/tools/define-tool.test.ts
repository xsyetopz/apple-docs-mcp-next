/** One tool as a client sees it: its arguments checked and completed by its schema, its answer or its one error result */
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { AppError, ErrorType } from "../../src/core/errors.ts";
import { PART_BYTES } from "../../src/tools/answer-parts.ts";
import { defineTool } from "../../src/tools/define-tool.ts";
import { callTool, textOf } from "../mocks/tool-client.ts";

const inputSchema = z.object({
	query: z.string(),
	limit: z.number().default(5),
});

const LONG = Array.from(
	{ length: 2000 },
	(_, index) => `- Result ${index}: one line of a long answer to a search`,
).join("\n");

describe("a tool", () => {
	const run = mock<(input: z.output<typeof inputSchema>) => Promise<string>>();
	let client: Client;

	beforeEach(async () => {
		run.mockReset();
		run.mockResolvedValue("Found it");
		const server = new McpServer({ name: "test", version: "test" });
		defineTool({
			name: "find",
			title: "Find",
			description: "Finds things",
			inputSchema,
			run,
		})(server);
		const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
		client = new Client({ name: "test", version: "test" });
		await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
	});

	afterEach(async () => {
		await client.close();
	});

	it("gets its arguments with the schema's defaults, and none of the server's own", async () => {
		const response = await callTool(client, "find", { query: "view", part: 1 });

		expect(response).toEqual({ content: [{ type: "text", text: "Found it" }] });
		expect(run).toHaveBeenCalledWith({ query: "view", limit: 5 });
	});

	it("is not called with arguments its schema rejects", async () => {
		const response = await callTool(client, "find", { limit: 3 });

		expect(response.isError).toBe(true);
		expect(textOf(response)).toContain("Input validation error");
		expect(run).not.toHaveBeenCalled();
	});

	it("answers a failure with one error result: its message, then its suggestions as a list", async () => {
		run.mockRejectedValue(
			new AppError({
				type: ErrorType.NOT_FOUND,
				message: "Gone",
				suggestions: ["Search first"],
			}),
		);

		const response = await callTool(client, "find", { query: "gone" });

		expect(response).toEqual({
			content: [
				{ type: "text", text: "Error: Gone\n\nSuggestions:\n• Search first" },
			],
			isError: true,
		});
	});

	it("answers any other throw with an error result that carries its message", async () => {
		run.mockRejectedValue(new Error("Apple is down"));

		const response = await callTool(client, "find", { query: "view" });

		expect(response.isError).toBe(true);
		expect(textOf(response)).toStartWith("Error: Apple is down");
	});

	it("returns a long answer one part at a time, each within the budget", async () => {
		run.mockResolvedValue(LONG);

		const first = await callTool(client, "find", { query: "view" });
		const second = await callTool(client, "find", { query: "view", part: 2 });

		expect(textOf(first)).toStartWith("- Result 0:");
		expect(textOf(first)).toContain(
			"For the next part, call find again with the same arguments and part: 2.",
		);
		expect(textOf(second)).toContain("\n\n---\nPart 2 of ");
		expect(Buffer.byteLength(textOf(first))).toBeLessThanOrEqual(PART_BYTES);
		expect(Buffer.byteLength(textOf(second))).toBeLessThanOrEqual(PART_BYTES);
		expect(run).toHaveBeenLastCalledWith({ query: "view", limit: 5 });
	});

	it("answers a part past the end with an error that names how many there are", async () => {
		const response = await callTool(client, "find", { query: "view", part: 2 });

		expect(response.isError).toBe(true);
		expect(textOf(response)).toStartWith(
			"Error: This answer has 1 part(s); there is no part 2",
		);
	});

	it("cuts an error that repeats a long argument down to one part", async () => {
		run.mockRejectedValue(new Error("x".repeat(3 * PART_BYTES)));

		const response = await callTool(client, "find", { query: "view" });

		expect(response.isError).toBe(true);
		expect(Buffer.byteLength(textOf(response))).toBeLessThanOrEqual(PART_BYTES);
	});
});
