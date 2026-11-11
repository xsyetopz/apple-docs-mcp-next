/**
 * Every tool answers over MCP with one text content item, whatever its use case returns.
 */

import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";

import type { Client } from "@modelcontextprotocol/client";

import * as docFetcher from "../src/docs/doc-fetcher.ts";
import * as findSimilarApis from "../src/docs/find-similar-apis.ts";
import * as platformCompatibility from "../src/docs/get-platform-compatibility.ts";
import * as relatedApis from "../src/docs/get-related-apis.ts";
import * as listTechnologies from "../src/docs/list-technologies.ts";
import * as resolveReferences from "../src/docs/resolve-references-batch.ts";
import * as frameworkSymbols from "../src/docs/search-framework-symbols.ts";
import {
	callTool,
	connectClient,
	stubApple,
	validateResponseFormat,
} from "./mocks/tool-client.ts";

const relationUrl = "https://developer.apple.com/documentation/swiftui/view";

const toolTests = [
	{ name: "list_technologies", args: {} },
	{ name: "search_framework_symbols", args: { framework: "SwiftUI" } },
	{
		name: "get_apple_doc_content",
		args: { url: "https://developer.apple.com/documentation/swiftui" },
	},
	{ name: "get_api_relations", args: { url: relationUrl, kind: "related" } },
	{ name: "get_api_relations", args: { url: relationUrl, kind: "references" } },
	{ name: "get_api_relations", args: { url: relationUrl, kind: "similar" } },
	{ name: "get_api_relations", args: { url: relationUrl, kind: "platforms" } },
];

const spyOnUseCases = (): void => {
	stubApple();
	spyOn(docFetcher, "fetchAppleDocJson").mockResolvedValue("Mock doc content");
	spyOn(listTechnologies, "handleListTechnologies").mockResolvedValue(
		"Mock technologies list",
	);
	spyOn(frameworkSymbols, "searchFrameworkSymbols").mockResolvedValue(
		"Mock framework symbols",
	);
	spyOn(relatedApis, "handleGetRelatedApis").mockResolvedValue(
		"Mock related APIs",
	);
	spyOn(resolveReferences, "handleResolveReferencesBatch").mockResolvedValue(
		"Mock references",
	);
	spyOn(
		platformCompatibility,
		"handleGetPlatformCompatibility",
	).mockResolvedValue("Mock platform compatibility");
	spyOn(findSimilarApis, "handleFindSimilarApis").mockResolvedValue(
		"Mock similar APIs",
	);
};

describe("All MCP tools response format consistency", () => {
	let client: Client;

	beforeEach(async () => {
		spyOnUseCases();
		client = await connectClient();
	});

	afterEach(async () => {
		await client.close();
	});

	it.each(toolTests)(
		"$name should return properly formatted response",
		async ({ name, args }) => {
			const response = await callTool(client, name, args);

			validateResponseFormat(response);
			expect(typeof response.content[0]?.text).toBe("string");
		},
	);
});
