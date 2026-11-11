import { describe, expect, it } from "bun:test";

import type { SearchType } from "../../src/docs/search-api.ts";
import { parseSearchResults } from "../../src/docs/search-parser.ts";
import { result, stream, wwdcSession } from "./search-stream-fixtures.ts";

describe("parseSearchResults", () => {
	const mockSearchUrl = "https://developer.apple.com/search/?q=test";
	const text = (jsonl: string, query = "test", filter: SearchType = "all") =>
		parseSearchResults([jsonl], query, mockSearchUrl, filter);

	describe("successful parsing", () => {
		it("should parse search results from the streamed response", () => {
			const output = text(
				stream([
					result("UIView", "/documentation/uikit/uiview", {
						description:
							"An object that manages the content for a rectangular area on the screen.",
						hierarchy: "UIKit > UIView",
					}),
					result("UIViewController", "/documentation/uikit/uiviewcontroller", {
						hierarchy: "UIKit > UIViewController",
					}),
				]),
			);

			expect(output).toContain("# Apple Documentation Search Results");
			expect(output).not.toContain("Query:");
			expect(output).toContain("2 results");
			expect(output).toContain(
				"- [UIView](https://developer.apple.com/documentation/uikit/uiview) (UIKit): An object that manages the content",
			);
			expect(output).toContain(
				"- [UIViewController](https://developer.apple.com/documentation/uikit/uiviewcontroller) (UIKit)",
			);
			expect(output).not.toContain("###");
			expect(output).not.toContain("Showing");
		});

		it("should keep documentation pages and design guidelines", () => {
			const output = text(
				stream([
					result("WWDC Video", "/videos/play/wwdc2023/10001"),
					result("Buttons", "/design/human-interface-guidelines/buttons", {
						kind: "article",
						hierarchy:
							"Human Interface Guidelines > Components > Menus and actions > Buttons",
					}),
				]),
			);

			expect(output).not.toContain("WWDC Video");
			expect(output).toContain("## Design Guidelines");
			expect(output).toContain(
				"[Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)",
			);
		});

		it("should list WWDC sessions under all, each with the call that reads its transcript and code", () => {
			const output = text(
				stream([wwdcSession("wwdc2023-10013", "Meet StoreKit for SwiftUI")]),
			);

			expect(output).toContain("## WWDC Sessions");
			expect(output).toContain(
				"- [Meet StoreKit for SwiftUI](https://developer.apple.com/videos/play/wwdc2023/10013)",
			);
			expect(output).toContain(
				'get_wwdc_video (year: "2023", videoId: "10013")',
			);
		});

		it("should leave WWDC sessions out of the other filters, and other events out of all", () => {
			const jsonl = stream([
				wwdcSession("wwdc2023-10013", "Meet StoreKit for SwiftUI"),
				wwdcSession(
					"tech-talks-110358",
					"A tech talk the bundled data does not hold",
				),
			]);

			expect(text(jsonl, "storekit", "documentation")).not.toContain(
				"Meet StoreKit",
			);
			expect(text(jsonl, "storekit", "sample")).not.toContain("Meet StoreKit");
			expect(text(jsonl)).not.toContain("A tech talk");
		});

		it("should list a page found by both searches once", () => {
			const session = wwdcSession(
				"wwdc2023-10035",
				"Perform accessibility audits for your app",
			);
			const output = parseSearchResults(
				[stream([session]), stream([session])],
				"audit",
				mockSearchUrl,
				"all",
			);

			expect(
				output.split("Perform accessibility audits for your app").length - 1,
			).toBe(1);
		});

		it("should keep only design guidelines under the design filter", () => {
			const jsonl = stream([
				result("UIButton", "/documentation/uikit/uibutton"),
				result("Buttons", "/design/human-interface-guidelines/buttons", {
					kind: "article",
				}),
			]);

			expect(text(jsonl, "buttons", "design")).not.toContain("uikit/uibutton");
			expect(text(jsonl, "buttons", "design")).toContain(
				"human-interface-guidelines/buttons",
			);
			expect(text(jsonl, "buttons", "documentation")).not.toContain(
				"human-interface-guidelines/buttons",
			);
		});

		it("should handle empty results", () => {
			const output = text(stream([]));

			expect(output).toContain('No results found for "test"');
			expect(output).toContain("### Suggestions:");
		});

		it("should take the framework from the hierarchy", () => {
			const output = text(
				stream([
					result("List", "/documentation/swiftui/list", {
						hierarchy: "SwiftUI > List",
					}),
					result("NSString", "/documentation/foundation/nsstring", {
						hierarchy: "Foundation > NSString",
					}),
				]),
			);

			expect(output).toContain(
				"[List](https://developer.apple.com/documentation/swiftui/list) (SwiftUI)",
			);
			expect(output).toContain("(Foundation)");
		});

		it("should limit results when too many", () => {
			const output = text(
				stream(
					Array.from({ length: 100 }, (_, i) =>
						result(`Result ${i}`, `/documentation/test/result${i}`, {
							description: `Description ${i}`,
						}),
					),
				),
			);

			expect(output).toContain("- [Result 0](");
			expect(output).toContain("- [Result 49](");
			expect(output).not.toContain("Result 99");
			expect(output).toContain("50 results");
			expect(output).toContain(
				"Showing 50 of 100. Narrow the query or set type.",
			);
		});

		it("should apply the type filter", () => {
			const jsonl = stream([
				result("GaugeStyle", "/documentation/swiftui/gaugestyle"),
				result("Building a gauge", "/documentation/swiftui/building-a-gauge", {
					kind: "sampleCode",
				}),
			]);

			expect(text(jsonl, "gauge", "documentation")).not.toContain(
				"building-a-gauge",
			);
			expect(text(jsonl, "gauge", "sample")).not.toContain(
				"swiftui/gaugestyle",
			);
			expect(text(jsonl, "gauge", "sample")).toContain("building-a-gauge");
		});
	});

	describe("error cases", () => {
		it("should handle an empty response", () => {
			const output = text("");

			expect(output).toContain("No results found");
			expect(output).toContain("### Suggestions:");
		});

		it("should report a malformed response", () => {
			expect(() => text("<html>not a stream</html>")).toThrow(SyntaxError);
		});

		it("should skip results with missing fields", () => {
			const output = text(
				stream([
					result("Valid Result", "/documentation/test", {
						description: "Valid description",
					}),
					{
						value: {
							metadata: {
								permalink: "https://developer.apple.com/documentation/x",
								description: "No title",
							},
						},
					},
					{ value: { metadata: { title: "No URL", description: "No URL" } } },
					{},
				]),
			);

			expect(output).toContain(
				"- [Valid Result](https://developer.apple.com/documentation/test): Valid description",
			);
			expect(output).not.toContain("No title");
			expect(output).not.toContain("No URL");
		});
	});

	describe("special cases", () => {
		it("should handle special characters in query", () => {
			const specialQuery = 'test & <special> "quoted"';
			const output = text(
				stream([result("Result", "/documentation/test")]),
				specialQuery,
			);

			expect(output).toContain(
				"- [Result](https://developer.apple.com/documentation/test)",
			);
		});

		it("should pass descriptions through", () => {
			const output = text(
				stream([
					result(
						"UILocalNotification",
						"/documentation/uikit/uilocalnotification",
						{
							description:
								"A notification that an app can schedule for presentation at a specific date and time.",
						},
					),
				]),
			);

			expect(output).toContain(
				"A notification that an app can schedule for presentation at a specific date and time.",
			);
		});
	});
});
