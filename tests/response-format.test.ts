/**
 * Response format validation tests
 *
 * Every tool answers over MCP with one text content item: the use case's Markdown, or one error result.
 */

import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";

import type { Client } from "@modelcontextprotocol/client";

import * as documentationUpdates from "../src/docs/get-documentation-updates.ts";
import * as sampleCode from "../src/docs/get-sample-code.ts";
import * as technologyOverviews from "../src/docs/get-technology-overviews.ts";
import {
	callTool,
	connectClient,
	stubApple,
	textOf,
	validateResponseFormat,
} from "./mocks/tool-client.ts";

const stream = (results: unknown[]): string =>
	JSON.stringify({
		kind: "search",
		diff: { append: JSON.stringify({ results }) },
	});

describe("Response Format Validation", () => {
	let client: Client;
	let http: ReturnType<typeof stubApple>;

	beforeEach(async () => {
		http = stubApple();
		client = await connectClient();
	});

	afterEach(async () => {
		await client.close();
	});

	describe("search_apple_docs response format", () => {
		it("should return properly formatted response for valid query", async () => {
			const response = await callTool(client, "search_apple_docs", {
				query: "SwiftUI",
			});

			validateResponseFormat(response);
			expect(response.content[0]?.text).toContain(
				"Apple Documentation Search Results",
			);
		});

		it("should ask for WWDC sessions separately under all, and list them after the documentation", async () => {
			http.postText
				.mockResolvedValueOnce(
					stream([
						{
							value: {
								metadata: {
									title: "SKTestSession",
									kind: "symbol",
									permalink:
										"https://developer.apple.com/documentation/storekittest/sktestsession",
								},
							},
						},
					]),
				)
				.mockResolvedValueOnce(
					stream([
						{
							value: {
								metadata: {
									ids: ["wwdc2020-10659"],
									titles: ["Introducing StoreKit Testing in Xcode"],
									itemTypes: ["Video"],
									permalinks: [
										"https://developer.apple.com/videos/play/wwdc2020/10659",
									],
								},
							},
						},
					]),
				);

			const response = await callTool(client, "search_apple_docs", {
				query: "StoreKit testing",
				type: "all",
			});
			const text = textOf(response);

			expect(http.postText.mock.calls[0]?.[1]).not.toHaveProperty(
				"searchScope",
			);
			expect(http.postText.mock.calls[0]?.[1]).toMatchObject({
				includedResponses: ["search"],
			});
			expect(JSON.stringify(http.postText.mock.calls[1]?.[1])).toContain(
				"/videos/play/",
			);
			expect(text).toContain("SKTestSession");
			expect(text).toContain('get_wwdc_video (year: "2020", videoId: "10659")');
			expect(text.indexOf("SKTestSession")).toBeLessThan(
				text.indexOf("Introducing StoreKit Testing"),
			);
		});

		it("should make one request under the other filters", async () => {
			await callTool(client, "search_apple_docs", {
				query: "StoreKit testing",
				type: "documentation",
			});

			expect(http.postText).toHaveBeenCalledTimes(1);
		});

		it("should return properly formatted error response for invalid input", async () => {
			const response = await callTool(client, "search_apple_docs", {
				query: "",
			});

			validateResponseFormat(response);
			expect(response.isError).toBe(true);
			expect(response.content[0]?.text).toContain("Error:");
		});
	});

	describe("Error response format consistency", () => {
		it("should maintain consistent error format across all tools", async () => {
			const response = await callTool(client, "get_apple_doc_content", {
				url: "invalid-url",
			});

			validateResponseFormat(response);
			expect(response.isError).toBe(true);
			expect(response.content[0]?.text).toContain("Error:");
		});

		it("should handle network errors with proper format", async () => {
			http.postText.mockRejectedValueOnce(new Error("Network error"));

			const response = await callTool(client, "search_apple_docs", {
				query: "SwiftUI",
				type: "all",
			});

			validateResponseFormat(response);
			expect(response.isError).toBe(true);
		});
	});

	describe("Response size and performance validation", () => {
		it("should return reasonable response sizes", async () => {
			const response = await callTool(client, "search_apple_docs", {
				query: "SwiftUI",
				type: "all",
			});

			validateResponseFormat(response);

			const responseText = textOf(response);
			expect(responseText.length).toBeLessThan(50_000);
			expect(responseText.length).toBeGreaterThan(10);
		});

		it("should handle large responses gracefully", async () => {
			const opened = '<li class="search-result">'.repeat(100);
			const closed =
				"<article><h1>Test Result</h1><p>Description</p></article></li>".repeat(
					100,
				);
			const largeHtml = `<html><body><ul class="search-results">${opened}${closed}</ul></body></html>`;
			http.getText.mockResolvedValueOnce(largeHtml);

			const response = await callTool(client, "search_apple_docs", {
				query: "SwiftUI",
				type: "all",
			});

			validateResponseFormat(response);
			expect(response.content[0]?.text).toBeDefined();
		});
	});

	describe("catalogue tools answer with one text item", () => {
		beforeEach(() => {
			spyOn(
				documentationUpdates,
				"handleGetDocumentationUpdates",
			).mockResolvedValue("Mock documentation updates");
			spyOn(
				technologyOverviews,
				"handleGetTechnologyOverviews",
			).mockResolvedValue("Mock technology overviews");
			spyOn(sampleCode, "handleGetSampleCode").mockResolvedValue(
				"Mock sample code",
			);
		});

		it.each([
			"get_documentation_updates",
			"get_technology_overviews",
			"get_sample_code",
		])("%s should return properly formatted response", async (name) => {
			const response = await callTool(client, name, {});

			validateResponseFormat(response);
			expect(typeof response.content[0]?.text).toBe("string");
		});
	});
});
