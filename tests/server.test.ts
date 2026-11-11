/**
 * The server as a client sees it, over the SDK's in-memory transport: the tools it lists and what it refuses.
 * `tools/define-tool.test.ts` covers what one call passes to its tool and answers.
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { createServer } from "../src/server.ts";
import { connectClient } from "./mocks/tool-client.ts";

describe("the server", () => {
	let client: Client;

	beforeEach(async () => {
		client = await connectClient();
	});

	afterEach(async () => {
		await client.close();
	});

	it("lists every tool, each with a description, hints and a 2020-12 schema", async () => {
		const { tools } = await client.listTools();

		expect(tools.map((tool) => tool.name).toSorted()).toEqual([
			"find_related_wwdc_videos",
			"get_api_relations",
			"get_apple_doc_content",
			"get_documentation_updates",
			"get_sample_code",
			"get_technology_overviews",
			"get_wwdc_code_examples",
			"get_wwdc_video",
			"list_technologies",
			"list_wwdc_videos",
			"search_apple_docs",
			"search_docs_map",
			"search_framework_symbols",
			"search_wwdc_content",
		]);
		for (const tool of tools) {
			expect(tool.description).toBeTruthy();
			expect(tool.annotations?.readOnlyHint).toBe(true);
			expect(typeof tool.annotations?.openWorldHint).toBe("boolean");
			expect(tool.inputSchema["$schema"]).toBe(
				"https://json-schema.org/draft/2020-12/schema",
			);
		}
	});

	it("lets every tool return a long answer in parts", async () => {
		const { tools } = await client.listTools();

		expect(
			tools.filter((tool) =>
				JSON.stringify(tool.inputSchema).includes('"part":{"default":1'),
			),
		).toHaveLength(tools.length);
	});

	it("refuses arguments a tool's schema rejects, before the tool asks Apple anything", async () => {
		const result = await client.callTool({
			name: "search_apple_docs",
			arguments: {},
		});

		expect(result).toMatchObject({ isError: true });
		expect(JSON.stringify(result)).toContain("Input validation error");
		expect(fetch).not.toHaveBeenCalled();
	});

	it("answers a tool that fails with an error result", async () => {
		const result = await client.callTool({
			name: "get_apple_doc_content",
			arguments: { url: "https://example.com/not-apple" },
		});

		expect(result).toMatchObject({ isError: true });
		expect(JSON.stringify(result)).toContain("Error: ");
	});

	it("refuses an unknown tool with a protocol error, not a tool result", async () => {
		const unknown = await client
			.callTool({ name: "unknown_tool", arguments: {} })
			.catch((error: unknown) => error);

		expect(unknown).toBeInstanceOf(Error);
		expect(String(unknown)).toContain("unknown_tool not found");
	});
});

describe("the server for a client speaking 2026-07-28", () => {
	it("answers server/discover and lists its tools with a public hour of caching", async () => {
		const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
		const handle = serveStdio(createServer, { transport: serverSide });
		const client = new Client(
			{ name: "test", version: "test" },
			{ versionNegotiation: { mode: { pin: "2026-07-28" } } },
		);
		await client.connect(clientSide);

		try {
			expect(client.getProtocolEra()).toBe("modern");
			const discovered = await client.discover();
			expect(discovered.supportedVersions).toContain("2026-07-28");
			expect(discovered.instructions).toBeTruthy();
			expect(discovered).toMatchObject({
				ttlMs: 3_600_000,
				cacheScope: "public",
			});
			const listed = await client.listTools();
			expect(listed.tools).toHaveLength(14);
			expect(listed).toMatchObject({ ttlMs: 3_600_000, cacheScope: "public" });
		} finally {
			await client.close();
			await handle.close();
		}
	});
});
