/**
 * The server as a client sees it, over the SDK's in-memory transport: the tools it lists, and each call routed to its
 * handler with its arguments checked against the tool's schema.
 */

import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import AppleDeveloperDocsMCPServer from "../src/index.ts";
import { registerTools } from "../src/tools/handlers.ts";

const answer = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

describe("the server", () => {
  let docs: AppleDeveloperDocsMCPServer;
  let client: Client;

  beforeEach(async () => {
    docs = new AppleDeveloperDocsMCPServer();
    const server = new McpServer({ name: "apple-docs-mcp", version: "test" });
    registerTools(server, docs);
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test", version: "test" });
    await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  });

  afterEach(async () => {
    await client.close();
  });

  it("lists every tool, each with a description and every argument described", async () => {
    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "browse_wwdc_topics",
      "find_related_wwdc_videos",
      "find_similar_apis",
      "get_apple_doc_content",
      "get_documentation_updates",
      "get_platform_compatibility",
      "get_related_apis",
      "get_sample_code",
      "get_technology_overviews",
      "get_wwdc_code_examples",
      "get_wwdc_video",
      "list_technologies",
      "list_wwdc_videos",
      "list_wwdc_years",
      "resolve_references_batch",
      "search_apple_docs",
      "search_docs_map",
      "search_framework_symbols",
      "search_wwdc_content",
    ]);
    for (const tool of tools) {
      expect(tool.description).toBeTruthy();
      expect(tool.annotations?.readOnlyHint).toBe(true);
      for (const argument of Object.values(tool.inputSchema.properties ?? {})) {
        expect((argument as { description?: string }).description).toBeTruthy();
      }
    }
  });

  it("passes a search its query, the type defaulting to all, and returns its answer", async () => {
    const search = spyOn(docs, "searchAppleDocs").mockResolvedValue(
      answer("Search results"),
    );

    await expect(
      client.callTool({
        name: "search_apple_docs",
        arguments: { query: "SwiftUI" },
      }),
    ).resolves.toMatchObject(answer("Search results"));
    expect(search).toHaveBeenCalledWith("SwiftUI", "all");
  });

  it("passes a page read its options, the ones left out false", async () => {
    const read = spyOn(docs, "getAppleDocContent").mockResolvedValue(
      answer("Doc content"),
    );

    await client.callTool({
      name: "get_apple_doc_content",
      arguments: {
        url: "https://developer.apple.com/documentation/swiftui",
        includeRelatedApis: true,
      },
    });

    expect(read).toHaveBeenCalledWith(
      "https://developer.apple.com/documentation/swiftui",
      true,
      false,
      false,
      false,
    );
  });

  it("fills the defaults a tool leaves to its schema", async () => {
    const list = spyOn(docs, "listTechnologies").mockResolvedValue(
      answer("Technologies"),
    );

    await client.callTool({
      name: "list_technologies",
      arguments: { category: "games", language: "swift", includeBeta: false },
    });
    await client.callTool({
      name: "list_technologies",
      arguments: { category: "ui", limit: 10 },
    });

    expect(list).toHaveBeenNthCalledWith(1, "games", "swift", false, 200);
    expect(list).toHaveBeenNthCalledWith(2, "ui", undefined, true, 10);
  });

  it("passes every argument it is given, in order", async () => {
    const symbols = spyOn(docs, "searchFrameworkSymbols").mockResolvedValue(
      answer("Symbols"),
    );
    const updates = spyOn(docs, "getDocumentationUpdates").mockResolvedValue(
      answer("Updates"),
    );

    await client.callTool({
      name: "search_framework_symbols",
      arguments: {
        framework: "swiftui",
        symbolType: "struct",
        namePattern: "*View",
        language: "swift",
        limit: 100,
      },
    });
    await client.callTool({
      name: "get_documentation_updates",
      arguments: {
        category: "wwdc",
        technology: "SwiftUI",
        year: "2024",
        searchQuery: "animation",
        includeBeta: true,
        limit: 50,
      },
    });

    expect(symbols).toHaveBeenCalledWith(
      "swiftui",
      "struct",
      "*View",
      "swift",
      100,
    );
    expect(updates).toHaveBeenCalledWith(
      "wwdc",
      "SwiftUI",
      "2024",
      "animation",
      true,
      50,
    );
  });

  it("refuses arguments its schema rejects, without calling the tool", async () => {
    const search = spyOn(docs, "searchAppleDocs");

    const result = await client.callTool({
      name: "search_apple_docs",
      arguments: {},
    });

    expect(result).toMatchObject({
      isError: true,
      content: [
        {
          type: "text",
          text: expect.stringContaining("Input validation error"),
        },
      ],
    });
    expect(search).not.toHaveBeenCalled();
  });

  it("answers an unknown tool, and a tool that throws, with an error result", async () => {
    spyOn(docs, "listTechnologies").mockRejectedValue(
      new Error("Apple is down"),
    );

    await expect(
      client.callTool({ name: "unknown_tool", arguments: {} }),
    ).resolves.toMatchObject({
      isError: true,
      content: [{ text: expect.stringContaining("unknown_tool not found") }],
    });
    await expect(
      client.callTool({ name: "list_technologies", arguments: {} }),
    ).resolves.toMatchObject({
      isError: true,
      content: [{ type: "text", text: "Apple is down" }],
    });
  });
});
