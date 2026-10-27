/**
 * The server as a client sees it, over the SDK's in-memory transport: the tools it lists, and each call routed to its
 * use case with its arguments checked against the tool's schema.
 */

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import { AppError, ErrorType } from "../src/core/errors.ts";

const searchAppleDocs = mock(async () => "Search results");
const fetchAppleDocJson = mock(async () => "Doc content");
const handleListTechnologies = mock(async () => "Technologies");
const searchFrameworkSymbols = mock(async () => "Symbols");
const handleGetDocumentationUpdates = mock(async () => "Updates");

for (const [path, useCases] of Object.entries({
  "../src/docs/search-apple-docs.ts": { searchAppleDocs },
  "../src/docs/doc-fetcher.ts": { fetchAppleDocJson },
  "../src/docs/list-technologies.ts": { handleListTechnologies },
  "../src/docs/search-framework-symbols.ts": { searchFrameworkSymbols },
  "../src/docs/get-documentation-updates.ts": {
    handleGetDocumentationUpdates,
  },
})) {
  const actual = await import(path);
  mock.module(path, () => ({ ...actual, ...useCases }));
}

const { createServer } = await import("../src/server.ts");

const answer = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

describe("the server", () => {
  let client: Client;

  beforeEach(async () => {
    for (const useCase of [
      searchAppleDocs,
      fetchAppleDocJson,
      handleListTechnologies,
      searchFrameworkSymbols,
      handleGetDocumentationUpdates,
    ]) {
      useCase.mockClear();
    }
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test", version: "test" });
    await Promise.all([
      createServer().connect(serverSide),
      client.connect(clientSide),
    ]);
  });

  afterEach(async () => {
    await client.close();
  });

  it("lists every tool, each with a description, hints and a 2020-12 schema", async () => {
    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([
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

  it("passes a search its query, the type defaulting to all, and returns its answer", async () => {
    await expect(
      client.callTool({
        name: "search_apple_docs",
        arguments: { query: "SwiftUI" },
      }),
    ).resolves.toMatchObject(answer("Search results"));
    expect(searchAppleDocs).toHaveBeenCalledWith({
      query: "SwiftUI",
      type: "all",
    });
  });

  it("passes a page read its url", async () => {
    await client.callTool({
      name: "get_apple_doc_content",
      arguments: { url: "https://developer.apple.com/documentation/swiftui" },
    });

    expect(fetchAppleDocJson).toHaveBeenCalledWith({
      url: "https://developer.apple.com/documentation/swiftui",
    });
  });

  it("fills the defaults a tool leaves to its schema", async () => {
    await client.callTool({
      name: "list_technologies",
      arguments: { category: "games", language: "swift", includeBeta: false },
    });
    await client.callTool({
      name: "list_technologies",
      arguments: { category: "ui", limit: 10 },
    });

    expect(handleListTechnologies).toHaveBeenNthCalledWith(1, {
      category: "games",
      language: "swift",
      includeBeta: false,
      limit: 200,
    });
    expect(handleListTechnologies).toHaveBeenNthCalledWith(2, {
      category: "ui",
      includeBeta: true,
      limit: 10,
    });
  });

  it("passes every argument it is given", async () => {
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

    expect(searchFrameworkSymbols).toHaveBeenCalledWith({
      framework: "swiftui",
      symbolType: "struct",
      namePattern: "*View",
      language: "swift",
      limit: 100,
    });
    expect(handleGetDocumentationUpdates).toHaveBeenCalledWith({
      category: "wwdc",
      technology: "SwiftUI",
      year: "2024",
      searchQuery: "animation",
      includeBeta: true,
      limit: 50,
    });
  });

  it("refuses arguments its schema rejects, without calling the tool", async () => {
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
    expect(searchAppleDocs).not.toHaveBeenCalled();
  });

  it("answers a failure with one error result: its message, then its suggestions as a list", async () => {
    fetchAppleDocJson.mockRejectedValueOnce(
      new AppError({
        type: ErrorType.NOT_FOUND,
        message: "Gone",
        suggestions: ["Search first"],
      }),
    );

    await expect(
      client.callTool({
        name: "get_apple_doc_content",
        arguments: { url: "https://developer.apple.com/documentation/gone" },
      }),
    ).resolves.toEqual({
      content: [
        { type: "text", text: "Error: Gone\n\nSuggestions:\n• Search first" },
      ],
      isError: true,
    });
  });

  it("refuses an unknown tool, and answers a tool that throws with an error result", async () => {
    handleListTechnologies.mockRejectedValueOnce(new Error("Apple is down"));

    // The v2 SDK answers an unknown tool with a protocol error, not a tool result
    await expect(
      client.callTool({ name: "unknown_tool", arguments: {} }),
    ).rejects.toThrow("unknown_tool not found");
    await expect(
      client.callTool({ name: "list_technologies", arguments: {} }),
    ).resolves.toMatchObject({
      isError: true,
      content: [
        { type: "text", text: expect.stringContaining("Error: Apple is down") },
      ],
    });
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
