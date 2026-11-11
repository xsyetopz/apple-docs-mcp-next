import { beforeEach, describe, expect, it } from "bun:test";

import { handleGetRelatedApis } from "../../src/docs/get-related-apis.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import {
	allRelated,
	conformingPage,
	viewPage,
} from "./get-related-apis.fixtures.ts";

describe("handleGetRelatedApis topics and summaries", () => {
	let getJson: ReturnType<typeof spyOnHttpClient>["getJson"];

	beforeEach(() => {
		({ getJson } = spyOnHttpClient());
	});

	it("groups the Topics members under their section titles", async () => {
		getJson.mockResolvedValue({
			...viewPage,
			topicSections: [
				{ title: "Creating a View", identifiers: ["swiftui/text"] },
				{
					title: "Showing Images",
					identifiers: [
						"swiftui/image",
						"swiftui/protocol1",
						"swiftui/protocol2",
						"swiftui/protocol3",
						"swiftui/text",
					],
				},
			],
			seeAlsoSections: [],
		});

		const result = await handleGetRelatedApis(allRelated);

		expect(result).toContain(
			"## Topics\n- Creating a View: [Text](/documentation/swiftui/text)\n- Showing Images: [Image](/documentation/swiftui/image)",
		);
		expect(result).toContain(
			"- Showing Images: [Image](/documentation/swiftui/image), +2 more",
		);
	});

	it("should format complex relationships correctly", async () => {
		getJson.mockResolvedValue(conformingPage);

		const result = await handleGetRelatedApis(allRelated);

		expect(result).toContain("# Related APIs for view");
		expect(result).toContain("2 related APIs");
		expect(result).toContain("## Conforming Types");
		expect(result).toContain("[AnyView]");
		expect(result).toContain("A type-erased view.");
		expect(result).toContain("[EmptyView]");
		expect(result).toContain("A view that doesn't display anything.");
	});

	it("keeps code names and links in summaries", async () => {
		getJson.mockResolvedValue({
			seeAlsoSections: [
				{
					title: "Stacking views in one column",
					identifiers: ["doc://SwiftUI/destination"],
				},
			],
			references: {
				"doc://SwiftUI/destination": {
					type: "topic",
					kind: "symbol",
					title: "navigationDestination(isPresented:destination:)",
					url: "/documentation/swiftui/view/navigationdestination(ispresented:destination:)",
					abstract: [
						{ type: "text", text: "Pushes the view onto a " },
						{ type: "reference", identifier: "doc://SwiftUI/NavigationStack" },
						{ type: "text", text: "." },
					],
				},
				"doc://SwiftUI/NavigationStack": {
					type: "topic",
					kind: "symbol",
					title: "NavigationStack",
					url: "/documentation/swiftui/navigationstack",
				},
			},
		});

		const result = await handleGetRelatedApis({
			...allRelated,
			apiUrl:
				"https://developer.apple.com/documentation/swiftui/navigationstack",
		});

		expect(result).toContain("Pushes the view onto a `NavigationStack`.");
	});
});
