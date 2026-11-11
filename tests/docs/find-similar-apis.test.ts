import { beforeEach, describe, expect, it } from "bun:test";

import { handleFindSimilarApis } from "../../src/docs/find-similar-apis.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import { query, textPage } from "./find-similar-apis.fixtures.ts";

describe("handleFindSimilarApis depth and filters", () => {
	let getJson: ReturnType<typeof spyOnHttpClient>["getJson"];

	beforeEach(() => {
		({ getJson } = spyOnHttpClient());
		getJson.mockResolvedValue(textPage);
	});

	it("should find similar APIs with shallow search depth", async () => {
		const result = await handleFindSimilarApis(
			query({ searchDepth: "shallow" }),
		);

		expect(getJson).toHaveBeenCalledTimes(1);
		expect(result).toContain("# Similar APIs to Text");
		expect(result).toContain("Structure · iOS 13.0+");
		expect(result).toContain("## See Also: Text Display");
		expect(result).toContain("- [Label]");
		expect(result).toContain("A view that displays text and an icon.");
		expect(result).toContain("- [TextField]");
		expect(result).toContain("2 similar APIs");
	});

	it("should include topic sections with medium search depth", async () => {
		const result = await handleFindSimilarApis(query());

		expect(result).toContain("## See Also: Text Display");
		expect(result).toContain("## Topic Group: Creating Text Views");
		expect(result).toContain("- [init(_:)]");
		expect(result).toContain("- [init(String)]");
		expect(result).toContain("4 similar APIs");
	});

	it("should perform deep search with related APIs", async () => {
		getJson.mockReset();
		getJson.mockResolvedValueOnce(textPage).mockResolvedValueOnce({
			data: {
				identifier: "swiftui/label",
				title: "Label",
				seeAlsoSections: [
					{
						title: "Label Components",
						identifiers: ["swiftui/labelstyle"],
					},
				],
			},
			references: {
				"swiftui/labelstyle": {
					type: "topic",
					title: "LabelStyle",
					url: "/documentation/swiftui/labelstyle",
					abstract: [{ type: "text", text: "A protocol for label styles." }],
				},
			},
		});

		const result = await handleFindSimilarApis(query({ searchDepth: "deep" }));

		expect(getJson.mock.calls.length).toBeGreaterThanOrEqual(2);
		expect(result).toContain("## See Also: Text Display");
		expect(result).toContain("- [Label]");
		expect(result).toContain("LabelStyle");
	});

	it("should filter by category", async () => {
		const result = await handleFindSimilarApis(
			query({ filterByCategory: "Creating" }),
		);

		expect(result).toContain("## Topic Group: Creating Text Views");
		expect(result).not.toContain("## See Also: Text Display");
		expect(result).toContain("2 similar APIs");
	});

	it("should exclude alternatives when includeAlternatives is false", async () => {
		const result = await handleFindSimilarApis(
			query({ includeAlternatives: false }),
		);

		expect(result).toContain("## See Also: Text Display");
		expect(result).not.toContain("## Topic Group: Creating Text Views");
	});

	it("should cap the total at limit and say how many more there are", async () => {
		const result = await handleFindSimilarApis(query({ limit: 3 }));

		expect(result).toContain("3 similar APIs");
		expect(result).toContain("…and 1 more");
		expect(result).toContain("Showing 3 of 4. Raise limit");
		expect(result).toContain("- [TextField]");
		expect(result).not.toContain("init(String)");
	});

	it("should count what the depth leaves out", async () => {
		const ids = Array.from({ length: 7 }, (_, i) => `swiftui/view${i}`);
		getJson.mockResolvedValue({
			data: {
				...textPage.data,
				seeAlsoSections: [{ title: "Views", identifiers: ids }],
				topicSections: [],
			},
			references: Object.fromEntries(
				ids.map((id, i) => [
					id,
					{
						type: "topic",
						title: `View${i}`,
						url: `/documentation/${id}`,
						kind: "symbol",
						role: "symbol",
						fragments: [{ kind: "keyword", text: "struct" }],
					},
				]),
			),
		});

		const result = await handleFindSimilarApis(
			query({ searchDepth: "shallow" }),
		);

		expect(result).toContain("5 similar APIs");
		expect(result).toContain("Showing 5 of 7.");
	});

	it("should not mention a cap when everything fits", async () => {
		const result = await handleFindSimilarApis(query({ limit: 4 }));

		expect(result).not.toContain("…and");
		expect(result).not.toContain("Showing");
	});
});
