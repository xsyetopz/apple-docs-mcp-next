import { beforeEach, describe, expect, it } from "bun:test";

import { indexCache } from "../../src/core/cache.ts";
import {
	type FrameworkSymbolsQuery,
	searchFrameworkSymbols,
} from "../../src/docs/search-framework-symbols.ts";
import { createTestFrameworkIndex, mockData } from "../helpers/test-helpers.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";

const defaultQuery: FrameworkSymbolsQuery = {
	framework: "uikit",
	symbolType: "class",
	namePattern: undefined,
	language: "swift",
	limit: 10,
};

const INDEX_URL = "https://developer.apple.com/tutorials/data/index/uikit";

const classItem = (
	path: string,
	title: string,
	flags: { beta?: boolean; deprecated?: boolean } = {},
): unknown => ({
	path,
	title,
	type: "class",
	beta: flags.beta ?? false,
	deprecated: flags.deprecated ?? false,
	children: [],
});

describe("searchFrameworkSymbols", () => {
	let http: ReturnType<typeof spyOnHttpClient>;

	beforeEach(() => {
		indexCache.clear();
		http = spyOnHttpClient();
		http.getJson.mockResolvedValue(mockData.frameworkIndex);
	});

	describe("successful searches", () => {
		it("should search for classes in UIKit framework", async () => {
			const result = await searchFrameworkSymbols(defaultQuery);

			expect(http.getJson).toHaveBeenCalledWith(INDEX_URL, undefined);
			expect(result).toContain("UIView");
			expect(result).toContain("UIViewController");
			expect(result).toContain("4 classes");
		});

		it("should search with wildcard pattern", async () => {
			const result = await searchFrameworkSymbols({
				...defaultQuery,
				namePattern: "*View",
			});

			expect(result).toContain("UIView");
			expect(result).toContain("UITableView");
			expect(result).toContain("UIStackView");
			expect(result).not.toContain("UIViewController");
			expect(result).toContain('matching "*View"');
		});

		it("should search all symbol types", async () => {
			const result = await searchFrameworkSymbols({
				...defaultQuery,
				symbolType: "all",
			});

			expect(result).toContain("## Classes (4)");
			expect(result).toContain("## Structs (1)");
			expect(result).toContain("UIView");
			expect(result).toContain("List");
		});

		it("should use cache when available", async () => {
			const first = await searchFrameworkSymbols(defaultQuery);
			const second = await searchFrameworkSymbols(defaultQuery);

			expect(second).toBe(first);
			expect(http.getJson).toHaveBeenCalledTimes(1);
		});

		it("should respect limit parameter", async () => {
			http.getJson.mockResolvedValue(
				createTestFrameworkIndex(
					Array.from({ length: 20 }, (_, i) =>
						classItem(`/documentation/uikit/class${i}`, `Class${i}`),
					),
				),
			);

			const result = await searchFrameworkSymbols({
				...defaultQuery,
				limit: 5,
			});

			expect(result.match(/\[.*?\]/gu)).toHaveLength(5);
			expect(result).toContain("Stopped at the limit of 5");
			expect(result).toContain("raise limit");
		});

		it("should support Objective-C language", async () => {
			const result = await searchFrameworkSymbols({
				...defaultQuery,
				language: "occ",
			});

			expect(result).toContain("UIView");
			expect(result).toContain("1 classes");
		});
	});

	describe("error cases", () => {
		it("should reject an invalid framework", async () => {
			http.getJson.mockRejectedValue(new Error("404 Not Found"));

			const error = await searchFrameworkSymbols({
				...defaultQuery,
				framework: "invalidframework",
			}).catch((error_: unknown) => error_);

			expect(error).toEqual(new Error("404 Not Found"));
		});

		it("should handle empty framework name", async () => {
			http.getJson.mockRejectedValue(new Error("Invalid URL"));

			const error = await searchFrameworkSymbols({
				...defaultQuery,
				framework: "",
			}).catch((error_: unknown) => error_);

			expect(error).toEqual(new Error("Invalid URL"));
		});

		it("should handle unsupported language", async () => {
			http.getJson.mockResolvedValue({
				interfaceLanguages: {
					swift: mockData.frameworkIndex.interfaceLanguages.swift,
				},
			});

			const result = await searchFrameworkSymbols({
				...defaultQuery,
				language: "occ",
			});

			expect(result).toContain('Language "occ" not available');
			expect(result).toContain("Available languages: swift");
		});

		it("should handle no results gracefully", async () => {
			http.getJson.mockResolvedValue(
				createTestFrameworkIndex([
					classItem("/documentation/uikit/uiview", "UIView"),
				]),
			);

			const result = await searchFrameworkSymbols({
				...defaultQuery,
				symbolType: "macro",
			});

			expect(result).toContain("No macros found in uikit framework");
		});

		it("should handle network errors", async () => {
			http.getJson.mockRejectedValue(new Error("Network error"));

			const error = await searchFrameworkSymbols(defaultQuery).catch(
				(error_: unknown) => error_,
			);

			expect(error).toEqual(new Error("Network error"));
		});
	});

	describe("edge cases", () => {
		it("should handle special characters in pattern", async () => {
			const result = await searchFrameworkSymbols({
				...defaultQuery,
				namePattern: "UI[View]*",
			});

			expect(result).toContain('No classes found matching pattern "UI[View]*"');
		});

		it("should handle deeply nested items", async () => {
			http.getJson.mockResolvedValue(
				createTestFrameworkIndex([
					{
						path: "/documentation/uikit/views",
						title: "Views",
						type: "collection",
						children: [
							{
								path: "/documentation/uikit/views/basic",
								title: "Basic Views",
								type: "collection",
								children: [classItem("/documentation/uikit/uiview", "UIView")],
							},
						],
					},
				]),
			);

			const result = await searchFrameworkSymbols(defaultQuery);

			expect(result).toContain("UIView");
			expect(result).toContain("1 classes");
		});

		it("should handle framework name case variations", async () => {
			const query = { ...defaultQuery, limit: 1 };
			await searchFrameworkSymbols({ ...query, framework: "UIKit" });
			await searchFrameworkSymbols({ ...query, framework: "UIKIT" });
			await searchFrameworkSymbols({ ...query, framework: "uikit" });

			expect(http.getJson).toHaveBeenCalledWith(INDEX_URL, undefined);
			expect(http.getJson).toHaveBeenCalledTimes(1);
		});

		it("should handle items with beta and deprecated flags", async () => {
			http.getJson.mockResolvedValue(
				createTestFrameworkIndex([
					classItem("/documentation/uikit/betaclass", "BetaClass", {
						beta: true,
					}),
					classItem("/documentation/uikit/deprecatedclass", "DeprecatedClass", {
						deprecated: true,
					}),
				]),
			);

			const result = await searchFrameworkSymbols(defaultQuery);

			expect(result).toContain("[BetaClass](");
			expect(result).toContain("(Beta)");
			expect(result).toContain("[DeprecatedClass](");
			expect(result).toContain("(Deprecated)");
			expect(result).not.toContain("Stopped at the limit");
		});
	});
});
