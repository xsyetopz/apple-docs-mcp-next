import { beforeEach, describe, expect, it } from "bun:test";

import { apiCache, generateUrlCacheKey } from "../../src/core/cache.ts";
import { fetchAppleDocJson } from "../../src/docs/doc-fetcher.ts";
import { mockData } from "../helpers/test-helpers.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import {
	articleDoc,
	complexDoc,
	mockDocUrl,
	mockJsonUrl,
	nestedDoc,
} from "./doc-fetcher-fixtures.ts";

describe("fetchAppleDocJson", () => {
	let http: ReturnType<typeof spyOnHttpClient>;

	beforeEach(() => {
		apiCache.clear();
		http = spyOnHttpClient();
	});

	describe("successful fetching", () => {
		it("should fetch and format documentation", async () => {
			http.getJson.mockResolvedValue(mockData.docJsonData);

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(http.getJson).toHaveBeenCalledWith(mockJsonUrl, undefined);
			expect(result).toContain("# UIView");
			expect(result).toContain("**Class**");
			expect(result).toContain("class UIView");
			expect(apiCache.get(generateUrlCacheKey(mockJsonUrl))).toBe(result);
		});

		it("reads a page named by its site path, as its links name it", async () => {
			http.getJson.mockResolvedValue(mockData.docJsonData);

			const result = await fetchAppleDocJson({
				url: "/documentation/uikit/uiview",
			});

			expect(http.getJson).toHaveBeenCalledWith(mockJsonUrl, undefined);
			expect(result).toContain("# UIView");
		});

		it("lists Topics without member summaries when the page would run past the page limit", async () => {
			const summary = "A long member summary. ".repeat(20);
			const members = Array.from({ length: 100 }, (_, i) => `doc://x/m${i}`);
			http.getJson.mockResolvedValue({
				metadata: { title: "Big", role: "collection" },
				topicSections: [{ title: "Members", identifiers: members }],
				references: Object.fromEntries(
					members.map((id, i) => [
						id,
						{
							type: "topic",
							title: `member${i}`,
							url: `/documentation/x/m${i}`,
							kind: "symbol",
							abstract: [{ type: "text", text: summary }],
						},
					]),
				),
			});

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(result).toContain("- [`member50`](/documentation/x/m50)\n");
			expect(result).not.toContain(summary.trim());
			expect(result).toContain('get_api_relations kind "related"');
			expect(result.length).toBeLessThan(40_000);
		});

		it("should use cache when available", async () => {
			apiCache.set(generateUrlCacheKey(mockJsonUrl), "# Cached Documentation");

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(result).toBe("# Cached Documentation");
			expect(http.getJson).not.toHaveBeenCalled();
		});

		it("should list the relationships a page has", async () => {
			http.getJson.mockResolvedValue({
				...mockData.docJsonData,
				relationshipsSections: [
					{
						type: "inheritsFrom",
						title: "Inherits From",
						identifiers: [
							"doc://com.apple.documentation/documentation/uikit/uiresponder",
						],
					},
				],
			});

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(result).toContain("# UIView");
			expect(result).toContain("### Inherits From");
			expect(result).toContain("uiresponder");
		});

		it("should handle complex documentation structure", async () => {
			http.getJson.mockResolvedValue(complexDoc);

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(result).toContain("@MainActor class UIView : UIResponder");
			expect(result).toContain("An object that manages the content");
			expect(result).toContain("Views are the fundamental building blocks");
			expect(result).toContain("## Platform Availability");
			expect(result).toContain("**iOS** 2.0+");
			expect(result).toContain("**iPadOS** 2.0+");
		});
	});

	describe("nested content blocks", () => {
		it("should render code in language tabs, notes and lists", async () => {
			http.getJson.mockResolvedValue(nestedDoc);

			const text = await fetchAppleDocJson({ url: mockDocUrl });

			expect(text).toContain(
				"```swift\nclass UNCalendarNotificationTrigger\n```",
			);
			expect(text).toContain(
				"**Swift**\n\n```swift\nvar date = DateComponents()\ndate.hour = 8\n```",
			);
			expect(text).toContain(
				"**Objective-C**\n\n```objc\nNSDateComponents* date = [NSDateComponents new];\n```",
			);
			expect(text).toContain("> **Important:** Ask for permission first.");
			expect(text).toContain("- First item");
		});
	});

	describe("articles", () => {
		it("should render an article in full: headings, bold rules, link titles, columns, tables and code", async () => {
			http.getJson.mockResolvedValue(articleDoc);

			const text = await fetchAppleDocJson({ url: mockDocUrl });

			expect(text).toContain("## Overview\n\nA tab bar lets people navigate.");
			expect(text).toContain("## Best practices");
			expect(text).toContain(
				"**Use a tab bar to support navigation.** For actions, use a " +
					"[toolbar](/design/human-interface-guidelines/toolbars) or " +
					"[`UITabBar`](/documentation/uikit/uitabbar).",
			);
			expect(text).toContain("### iPadOS");
			expect(text).toContain("Left column");
			expect(text).toContain("```swift\nTabView { }\n```");
			expect(text).toContain(
				"| Date | Changes |\n| --- | --- |\n| June 8, 2026 | Updated art. |",
			);
		});
	});
});
