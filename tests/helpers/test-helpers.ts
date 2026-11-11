/**
 * Mock data for tests
 */
export const mockData = {
	frameworkIndex: {
		interfaceLanguages: {
			swift: [
				{
					path: "/documentation/uikit/uiview",
					title: "UIView",
					type: "class",
					beta: false,
					deprecated: false,
					children: [],
				},
				{
					path: "/documentation/uikit/uiviewcontroller",
					title: "UIViewController",
					type: "class",
					beta: false,
					deprecated: false,
					children: [],
				},
				{
					path: "/documentation/uikit/uitableview",
					title: "UITableView",
					type: "class",
					beta: false,
					deprecated: false,
					children: [],
				},
				{
					path: "/documentation/uikit/uistackview",
					title: "UIStackView",
					type: "class",
					beta: false,
					deprecated: false,
					children: [],
				},
				{
					path: "/documentation/uikit/list",
					title: "List",
					type: "struct",
					beta: false,
					deprecated: false,
					children: [],
				},
			],
			occ: [
				{
					path: "/documentation/uikit/uiview",
					title: "UIView",
					type: "class",
					beta: false,
					deprecated: false,
					children: [],
				},
			],
		},
	},

	docJsonData: {
		primaryContentSections: [
			{
				kind: "declarations",
				declarations: [
					{
						tokens: [
							{ text: "class", kind: "keyword" },
							{ text: " " },
							{ text: "UIView", kind: "typeIdentifier" },
						],
					},
				],
			},
		],
		metadata: {
			roleHeading: "Class",
			title: "UIView",
			modules: [{ name: "UIKit" }],
		},
	},
};

/**
 * Create a test framework index with specific items
 */
export const createTestFrameworkIndex = (items: unknown[]) => ({
	interfaceLanguages: {
		swift: items,
	},
});
