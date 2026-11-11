const text = (value: string) => ({
	type: "paragraph",
	inlineContent: [{ type: "text", text: value }],
});

export const mockDocUrl =
	"https://developer.apple.com/documentation/uikit/uiview";

export const mockJsonUrl =
	"https://developer.apple.com/tutorials/data/documentation/uikit/uiview.json";

export const complexDoc = {
	primaryContentSections: [
		{
			kind: "declarations",
			declarations: [
				{
					tokens: [
						{ text: "@MainActor", kind: "attribute" },
						{ text: " " },
						{ text: "class", kind: "keyword" },
						{ text: " " },
						{ text: "UIView", kind: "typeIdentifier" },
						{ text: " : ", kind: "text" },
						{
							text: "UIResponder",
							kind: "typeIdentifier",
							preciseIdentifier: "c:objc(cs)UIResponder",
						},
					],
				},
			],
		},
		{
			kind: "content",
			content: [
				text(
					"Views are the fundamental building blocks of your app's user interface.",
				),
			],
		},
	],
	metadata: {
		roleHeading: "Class",
		title: "UIView",
		modules: [{ name: "UIKit" }],
		platforms: [
			{ name: "iOS", introducedAt: "2.0", current: "17.0" },
			{ name: "iPadOS", introducedAt: "2.0", current: "17.0" },
		],
	},
	abstract: [
		{
			type: "text",
			text: "An object that manages the content for a rectangular area on the screen.",
		},
	],
	topicSections: [
		{
			title: "Creating a View",
			identifiers: [
				"doc://com.apple.documentation/documentation/uikit/uiview/init(frame:)",
				"doc://com.apple.documentation/documentation/uikit/uiview/init(coder:)",
			],
		},
	],
};

export const nestedDoc = {
	primaryContentSections: [
		{
			kind: "declarations",
			declarations: [
				{
					tokens: [
						{ text: "class UNCalendarNotificationTrigger" },
						{ text: "\n" },
					],
				},
			],
		},
		{
			kind: "content",
			content: [
				{ type: "heading", text: "Overview" },
				{
					type: "tabNavigator",
					tabs: [
						{
							title: "Swift",
							content: [
								{
									type: "codeListing",
									syntax: "swift",
									code: ["var date = DateComponents()", "date.hour = 8"],
								},
							],
						},
						{
							title: "Objective-C",
							content: [
								{
									type: "codeListing",
									syntax: "objc",
									code: ["NSDateComponents* date = [NSDateComponents new];"],
								},
							],
						},
					],
				},
				{
					type: "aside",
					name: "Important",
					content: [text("Ask for permission first.")],
				},
				{
					type: "unorderedList",
					items: [{ content: [text("First item")] }],
				},
			],
		},
	],
	metadata: {
		roleHeading: "Class",
		title: "UNCalendarNotificationTrigger",
	},
};

export const articleDoc = {
	primaryContentSections: [
		{
			kind: "content",
			content: [
				text("A tab bar lets people navigate."),
				{ type: "heading", level: 2, text: "Best practices" },
				{
					type: "paragraph",
					inlineContent: [
						{
							type: "strong",
							inlineContent: [
								{ type: "text", text: "Use a tab bar to support navigation." },
							],
						},
						{ type: "text", text: " For actions, use a " },
						{
							type: "reference",
							identifier: "doc://com.apple.HIG/toolbars",
							isActive: true,
							overridingTitle: "toolbar",
						},
						{ type: "text", text: " or " },
						{
							type: "reference",
							identifier:
								"doc://com.apple.documentation/documentation/uikit/uitabbar",
							isActive: true,
						},
						{ type: "text", text: "." },
					],
				},
				{ type: "heading", level: 3, text: "iPadOS" },
				{ type: "row", columns: [{ content: [text("Left column")] }] },
				{ type: "codeListing", syntax: "swift", code: ["TabView { }"] },
				{
					type: "table",
					header: "row",
					rows: [
						[[text("Date")], [text("Changes")]],
						[[text("June 8, 2026")], [text("Updated art.")]],
					],
				},
			],
		},
	],
	references: {
		"doc://com.apple.HIG/toolbars": {
			type: "topic",
			title: "Toolbars",
			url: "/design/human-interface-guidelines/toolbars",
		},
		"doc://com.apple.documentation/documentation/uikit/uitabbar": {
			type: "topic",
			title: "UITabBar",
			url: "/documentation/uikit/uitabbar",
			kind: "symbol",
		},
	},
	metadata: { role: "article", title: "Tab bars" },
};
