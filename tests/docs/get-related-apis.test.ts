import { beforeEach, describe, expect, it } from "bun:test";

import { handleGetRelatedApis } from "../../src/docs/get-related-apis.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import {
	allRelated,
	apiUrl,
	jsonUrl,
	viewPage,
} from "./get-related-apis.fixtures.ts";

describe("handleGetRelatedApis", () => {
	let getJson: ReturnType<typeof spyOnHttpClient>["getJson"];

	beforeEach(() => {
		({ getJson } = spyOnHttpClient());
		getJson.mockResolvedValue(viewPage);
	});

	it("should get all related APIs by default", async () => {
		const result = await handleGetRelatedApis(allRelated);

		expect(getJson).toHaveBeenCalledWith(jsonUrl, undefined);
		expect(result).toContain("# Related APIs for view");
		expect(result).toContain("5 related APIs");
		expect(result).toContain("## Inherits From");
		expect(result).toContain("[Protocol1]");
		expect(result).toContain("## Conforms To");
		expect(result).toContain("[Protocol2]");
		expect(result).toContain("[Protocol3]");
		expect(result).toContain("## See Also");
		expect(result).toContain("[Text]");
		expect(result).toContain("A view that displays text.");
	});

	it("should print one line per API: link, then summary", async () => {
		const result = await handleGetRelatedApis(allRelated);

		expect(result).toContain(
			"- [Text](/documentation/swiftui/text): A view that displays text.",
		);
		expect(result).not.toContain("###");
		expect(result).not.toContain("*Type:");
		expect(result).not.toContain("…and");
	});

	it("should cap each group at limit and end it with how many more", async () => {
		const ids = ["a", "b", "c", "d", "e"].map((name) => `swiftui/${name}`);
		const moreIds = ids.slice(0, 2).map((id) => `${id}2`);
		getJson.mockResolvedValue({
			relationshipsSections: [
				{ type: "conformsTo", title: "Conforms To", identifiers: ids },
			],
			seeAlsoSections: [{ title: "More", identifiers: moreIds }],
			references: Object.fromEntries(
				[...ids, ...moreIds].map((id) => [
					id,
					{
						type: "topic",
						title: id.toUpperCase(),
						url: `/documentation/${id}`,
						kind: "symbol",
					},
				]),
			),
		});

		const result = await handleGetRelatedApis({ ...allRelated, limit: 3 });

		expect(result).toContain("7 related APIs");
		expect(result).toContain("[SWIFTUI/C]");
		expect(result).not.toContain("[SWIFTUI/D]");
		expect(result).toContain("…and 2 more");
		expect(result.split("…and")).toHaveLength(2);
		expect(result).toContain("## See Also\n- [SWIFTUI/A2]");
		expect(result).toContain("Showing 3 per group. Raise limit");
	});

	it("should exclude inherited APIs when includeInherited is false", async () => {
		const result = await handleGetRelatedApis({
			...allRelated,
			includeInherited: false,
		});

		expect(result).not.toContain("## Inherits From");
		expect(result).not.toContain("Protocol1");
		expect(result).toContain("## Conforms To");
		expect(result).toContain("## See Also");
	});

	it("should exclude conformance when includeConformance is false", async () => {
		const result = await handleGetRelatedApis({
			...allRelated,
			includeConformance: false,
		});

		expect(result).toContain("## Inherits From");
		expect(result).not.toContain("## Conforms To");
		expect(result).not.toContain("Protocol2");
		expect(result).toContain("## See Also");
	});

	it("should exclude see also when includeSeeAlso is false", async () => {
		const result = await handleGetRelatedApis({
			...allRelated,
			includeSeeAlso: false,
		});

		expect(result).toContain("## Inherits From");
		expect(result).toContain("## Conforms To");
		expect(result).not.toContain("## See Also");
		expect(result).not.toContain("Text");
	});

	it("should handle APIs with no relationships", async () => {
		getJson.mockResolvedValue({
			identifier: "swiftui/view",
			title: "View",
			metadata: { roleHeading: "Protocol" },
			references: {},
		});

		const result = await handleGetRelatedApis(allRelated);

		expect(result).toContain("No related APIs found for:");
		expect(result).toContain(apiUrl);
	});

	it("should handle invalid URL", async () => {
		const error = await handleGetRelatedApis({
			...allRelated,
			apiUrl: "invalid-url",
		}).catch((error_: unknown) => error_);

		expect(error).toEqual(
			new Error("Invalid Apple Developer Documentation URL"),
		);
	});

	it("should handle fetch errors", async () => {
		getJson.mockRejectedValue(new Error("Network error"));

		const error = await handleGetRelatedApis(allRelated).catch(
			(error_: unknown) => error_,
		);

		expect(error).toEqual(new Error("Network error"));
	});

	it("should handle malformed JSON response", async () => {
		getJson.mockResolvedValue({ invalid: "response" });

		const result = await handleGetRelatedApis(allRelated);

		expect(result).toContain("No related APIs found for:");
	});
});
