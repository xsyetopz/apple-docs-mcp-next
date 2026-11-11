import { beforeEach, describe, expect, it } from "bun:test";

import { handleFindSimilarApis } from "../../src/docs/find-similar-apis.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import { deprecatedPage, query, topic } from "./find-similar-apis.fixtures.ts";

describe("handleFindSimilarApis edges", () => {
	let getJson: ReturnType<typeof spyOnHttpClient>["getJson"];

	beforeEach(() => {
		({ getJson } = spyOnHttpClient());
	});

	it("should handle APIs with no similar items", async () => {
		getJson.mockResolvedValue({
			data: {
				identifier: "swiftui/text",
				metadata: { title: "Text", roleHeading: "Structure" },
			},
			references: {},
		});

		const result = await handleFindSimilarApis(query());

		expect(result).toContain("# Similar APIs to Text");
		expect(result).toContain("No similar APIs found");
	});

	it("should handle invalid URL", async () => {
		const error = await handleFindSimilarApis(
			query({ apiUrl: "invalid-url" }),
		).catch((error_: unknown) => error_);

		expect(error).toEqual(
			new Error("Invalid Apple Developer Documentation URL"),
		);
	});

	it("should handle fetch errors gracefully", async () => {
		getJson.mockRejectedValue(new Error("Network error"));

		const error = await handleFindSimilarApis(query()).catch(
			(error_: unknown) => error_,
		);

		expect(error).toHaveProperty("message", "Network error");
	});

	it("should deduplicate similar APIs across sections", async () => {
		getJson.mockResolvedValue({
			data: {
				identifier: "swiftui/text",
				title: "Text",
				seeAlsoSections: [
					{
						title: "Section 1",
						identifiers: ["swiftui/label", "swiftui/textfield"],
					},
					{
						title: "Section 2",
						identifiers: ["swiftui/label", "swiftui/image"],
					},
				],
			},
			references: {
				"swiftui/label": topic("Label", "label"),
				"swiftui/textfield": topic("TextField", "textfield"),
				"swiftui/image": topic("Image", "image"),
			},
		});

		const result = await handleFindSimilarApis(query());

		expect(result.split("- [Label]")).toHaveLength(2);
		expect(result).toContain("3 similar APIs");
	});

	it("lists the replacements a deprecated API names first, keeping code names in summaries", async () => {
		getJson.mockResolvedValue(deprecatedPage);

		const result = await handleFindSimilarApis(
			query({
				apiUrl:
					"https://developer.apple.com/documentation/swiftui/navigationview",
			}),
		);

		expect(result).toContain(
			"**Deprecated:** Use [`NavigationStack`](/documentation/swiftui/navigationstack) " +
				"and [`NavigationSplitView`](/documentation/swiftui/navigationsplitview) instead.",
		);
		expect(result.indexOf("[NavigationSplitView]")).toBeLessThan(
			result.indexOf("[tabItem(_:)]"),
		);
		expect(result).toContain("## Replacement: Named in the deprecation note");
		expect(result).toContain("Pairs with `NavigationStack`.");
	});
});
