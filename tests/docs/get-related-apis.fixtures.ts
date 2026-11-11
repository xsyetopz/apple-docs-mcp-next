import type { RelatedApisQuery } from "../../src/docs/get-related-apis.ts";

export const apiUrl = "https://developer.apple.com/documentation/swiftui/view";

export const jsonUrl =
	"https://developer.apple.com/tutorials/data/documentation/swiftui/view.json";

export const allRelated: RelatedApisQuery = {
	apiUrl,
	includeInherited: true,
	includeConformance: true,
	includeSeeAlso: true,
	limit: 10,
};

const symbol = (name: string, abstract?: string) => ({
	type: "topic",
	title: name,
	url: `/documentation/swiftui/${name.toLowerCase()}`,
	kind: "symbol",
	...(abstract === undefined
		? {}
		: { abstract: [{ type: "text", text: abstract }] }),
});

export const viewPage = {
	identifier: "swiftui/view",
	title: "View",
	abstract: [{ type: "text", text: "A type that represents a SwiftUI view." }],
	metadata: {
		roleHeading: "Protocol",
		platforms: [{ name: "iOS", introducedAt: "13.0" }],
	},
	relationshipsSections: [
		{
			type: "inheritsFrom",
			title: "Inherits From",
			identifiers: ["swiftui/protocol1"],
		},
		{
			type: "conformsTo",
			title: "Conforms To",
			identifiers: ["swiftui/protocol2", "swiftui/protocol3"],
		},
	],
	seeAlsoSections: [
		{
			title: "Related Views",
			identifiers: ["swiftui/text", "swiftui/image"],
		},
	],
	references: {
		"swiftui/protocol1": symbol("Protocol1"),
		"swiftui/protocol2": symbol("Protocol2"),
		"swiftui/protocol3": symbol("Protocol3"),
		"swiftui/text": symbol("Text", "A view that displays text."),
		"swiftui/image": symbol("Image", "A view that displays an image."),
	},
};

export const conformingPage = {
	identifier: "swiftui/view",
	title: "View",
	metadata: {
		roleHeading: "Protocol",
		platforms: [
			{ name: "iOS", introducedAt: "13.0" },
			{ name: "macOS", introducedAt: "10.15" },
		],
	},
	relationshipsSections: [
		{
			type: "conformingTypes",
			title: "Conforming Types",
			identifiers: ["swiftui/anyview", "swiftui/emptyview"],
		},
	],
	references: {
		"swiftui/anyview": symbol("AnyView", "A type-erased view."),
		"swiftui/emptyview": symbol(
			"EmptyView",
			"A view that doesn't display anything.",
		),
	},
};
