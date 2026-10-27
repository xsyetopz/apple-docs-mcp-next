/**
 * get_apple_doc_content refuses a blank URL and a URL outside developer.apple.com before any request, with one error
 * result each.
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";

const { createServer } = await import("../../src/server.ts");

describe("get_apple_doc_content input validation", () => {
  let client: Client;

  beforeEach(async () => {
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

  it("refuses a blank URL with one error result", async () => {
    const result = await client.callTool({
      name: "get_apple_doc_content",
      arguments: { url: "" },
    });

    expect(result).toMatchObject({
      isError: true,
      content: [
        {
          type: "text",
          text: expect.stringContaining(
            "Error: URL is required and must be at least 1 character(s)",
          ),
        },
      ],
    });
  });

  it("refuses a URL outside developer.apple.com with one error result", async () => {
    const result = await client.callTool({
      name: "get_apple_doc_content",
      arguments: { url: "https://example.com/not-apple" },
    });

    expect(result).toMatchObject({
      isError: true,
      content: [
        {
          type: "text",
          text: "Error: URL must be from developer.apple.com",
        },
      ],
    });
  });
});
