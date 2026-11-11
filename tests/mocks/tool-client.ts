import { expect } from "bun:test";

import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { z } from "zod";

import { apiCache, indexCache } from "../../src/core/cache.ts";
import { createServer } from "../../src/server.ts";
import { spyOnHttpClient } from "./http-client.mock.ts";

const toolResponse = z.object({
	content: z.array(z.object({ type: z.string(), text: z.string() })),
	isError: z.boolean().optional(),
});

export type ToolResponse = z.infer<typeof toolResponse>;

/** A client connected to a new server over the SDK's in-memory transport */
export const connectClient = async (): Promise<Client> => {
	const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
	const client = new Client({ name: "test", version: "test" });
	await Promise.all([
		createServer().connect(serverSide),
		client.connect(clientSide),
	]);
	return client;
};

/** Calls a tool and reads its answer as one MCP tool result */
export const callTool = async (
	client: Client,
	name: string,
	args: Record<string, unknown>,
): Promise<ToolResponse> =>
	toolResponse.parse(await client.callTool({ name, arguments: args }));

/** The text of every item of an answer */
export const textOf = (response: ToolResponse): string =>
	response.content.map((item) => item.text).join("\n");

/** A tool answers with one text item: `{ content: [{ type: 'text', text }], isError? }` */
export const validateResponseFormat = (response: ToolResponse): void => {
	expect(response.content).toHaveLength(1);
	expect(response.content.map((item) => item.type)).toEqual(["text"]);
};

/** Empties the caches the tools read, and answers Apple's servers with an empty search page until a test says otherwise */
export const stubApple = (): ReturnType<typeof spyOnHttpClient> => {
	apiCache.clear();
	indexCache.clear();
	const http = spyOnHttpClient();
	http.getText.mockResolvedValue(
		'<html><body><ul class="search-results"></ul></body></html>',
	);
	http.postText.mockResolvedValue("");
	http.getJson.mockResolvedValue({});
	return http;
};
