import type { DocumentationUpdatesQuery } from "../../src/docs/get-documentation-updates.ts";
import type { spyOnHttpClient } from "../mocks/http-client.mock.ts";

export type GetJsonSpy = ReturnType<typeof spyOnHttpClient>["getJson"];

export const query = (
	overrides: Partial<DocumentationUpdatesQuery> = {},
): DocumentationUpdatesQuery => ({
	category: "all",
	includeBeta: true,
	limit: 50,
	...overrides,
});

export const routeUpdates = (
	getJson: GetJsonSpy,
	updatesData: unknown,
	updatesIndex: unknown,
): void => {
	getJson.mockImplementation((url) =>
		Promise.resolve(url.includes("Updates.json") ? updatesData : updatesIndex),
	);
};

const topic = (name: string, slug: string, text: string, role: string) => ({
	type: "topic",
	title: name,
	url: `/documentation/updates/${slug}`,
	abstract: [{ text, type: "text" }],
	kind: "article",
	role,
});

export const updatesData = {
	topicSections: [
		{
			title: "WWDC",
			identifiers: [
				"doc://com.apple.Updates/documentation/Updates/wwdc2024",
				"doc://com.apple.Updates/documentation/Updates/wwdc2023",
			],
			anchor: "WWDC",
		},
		{
			title: "Technology updates",
			identifiers: [
				"doc://com.apple.Updates/documentation/Updates/SwiftUI",
				"doc://com.apple.Updates/documentation/Updates/UIKit",
			],
			anchor: "Technology-updates",
		},
		{
			title: "Release notes for SDKs, Xcode, and Safari",
			identifiers: [
				"doc://com.apple.documentation/documentation/ios-ipados-release-notes",
			],
			anchor: "Release-notes-for-SDKs-Xcode-and-Safari",
		},
	],
	references: {
		"doc://com.apple.Updates/documentation/Updates/wwdc2024": {
			...topic(
				"WWDC24",
				"wwdc2024",
				"Highlights of new technologies introduced at WWDC24.",
				"collectionGroup",
			),
			images: [{ type: "icon", identifier: "new.svg" }],
		},
		"doc://com.apple.Updates/documentation/Updates/wwdc2023": topic(
			"WWDC23",
			"wwdc2023",
			"Highlights of new technologies introduced at WWDC23.",
			"collectionGroup",
		),
		"doc://com.apple.Updates/documentation/Updates/SwiftUI": topic(
			"SwiftUI updates",
			"swiftui",
			"Learn about important changes to SwiftUI.",
			"article",
		),
		"doc://com.apple.Updates/documentation/Updates/UIKit": topic(
			"UIKit updates",
			"uikit",
			"Learn about important changes to UIKit.",
			"article",
		),
		"doc://com.apple.documentation/documentation/ios-ipados-release-notes": {
			...topic(
				"iOS & iPadOS Release Notes",
				"ios-ipados-release-notes",
				"Learn about changes to the iOS & iPadOS SDK.",
				"collection",
			),
			url: "/documentation/ios-ipados-release-notes",
		},
	},
};

const indexEntry = (
	slug: string,
	title: string,
	type: string,
	beta: boolean,
) => ({
	path: `/documentation/updates/${slug}`,
	title,
	type,
	beta,
});

export const updatesIndex = {
	interfaceLanguages: {
		swift: [
			{
				path: "/documentation/updates",
				title: "Updates",
				type: "module",
				children: [
					{ title: "WWDC", type: "groupMarker" },
					indexEntry("wwdc2024", "WWDC24", "collection", false),
					indexEntry("wwdc2023", "WWDC23", "collection", false),
					{ title: "Technology updates", type: "groupMarker" },
					indexEntry("swiftui", "SwiftUI updates", "article", true),
					indexEntry("uikit", "UIKit updates", "article", false),
				],
			},
		],
	},
};
