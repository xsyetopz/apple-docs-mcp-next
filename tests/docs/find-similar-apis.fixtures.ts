import type { SimilarApisQuery } from "../../src/docs/find-similar-apis.ts";

export const apiUrl = "https://developer.apple.com/documentation/swiftui/text";

export const query = (
	overrides: Partial<SimilarApisQuery> = {},
): SimilarApisQuery => ({
	apiUrl,
	searchDepth: "medium",
	includeAlternatives: true,
	limit: 15,
	...overrides,
});

export const topic = (name: string, path: string, abstract?: string) => ({
	type: "topic",
	title: name,
	url: `/documentation/swiftui/${path}`,
	...(abstract === undefined
		? {}
		: { abstract: [{ type: "text", text: abstract }] }),
});

export const textPage = {
	data: {
		identifier: "swiftui/text",
		title: "Text",
		abstract: [{ type: "text", text: "A view that displays text." }],
		metadata: {
			title: "Text",
			roleHeading: "Structure",
			platforms: [{ name: "iOS", introducedAt: "13.0" }],
		},
		seeAlsoSections: [
			{
				title: "Text Display",
				identifiers: ["swiftui/label", "swiftui/textfield"],
			},
		],
		topicSections: [
			{
				title: "Creating Text Views",
				identifiers: ["swiftui/text/init", "swiftui/text/init-string"],
			},
		],
	},
	references: {
		"swiftui/label": topic(
			"Label",
			"label",
			"A view that displays text and an icon.",
		),
		"swiftui/textfield": topic(
			"TextField",
			"textfield",
			"A control for entering text.",
		),
		"swiftui/text/init": topic("init(_:)", "text/init"),
		"swiftui/text/init-string": topic("init(String)", "text/init-string"),
	},
};

export const deprecatedPage = {
	title: "NavigationView",
	deprecationSummary: [
		{
			type: "paragraph",
			inlineContent: [
				{ type: "text", text: "Use " },
				{
					type: "reference",
					identifier: "doc://SwiftUI/NavigationStack",
					isActive: true,
				},
				{ type: "text", text: " and " },
				{
					type: "reference",
					identifier: "doc://SwiftUI/NavigationSplitView",
					isActive: true,
				},
				{ type: "text", text: " instead." },
			],
		},
	],
	seeAlsoSections: [
		{ title: "Deprecated Types", identifiers: ["doc://SwiftUI/tabItem"] },
	],
	references: {
		"doc://SwiftUI/NavigationStack": {
			type: "topic",
			kind: "symbol",
			title: "NavigationStack",
			url: "/documentation/swiftui/navigationstack",
			abstract: [{ type: "text", text: "A view that displays a root view." }],
		},
		"doc://SwiftUI/NavigationSplitView": {
			type: "topic",
			kind: "symbol",
			title: "NavigationSplitView",
			url: "/documentation/swiftui/navigationsplitview",
			abstract: [
				{ type: "text", text: "Pairs with " },
				{ type: "reference", identifier: "doc://SwiftUI/NavigationStack" },
				{ type: "text", text: "." },
			],
		},
		"doc://SwiftUI/tabItem": {
			type: "topic",
			kind: "symbol",
			title: "tabItem(_:)",
			url: "/documentation/swiftui/view/tabitem(_:)",
		},
	},
};
