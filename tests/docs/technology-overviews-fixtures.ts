const PATH = "/documentation/technologyoverviews";
const reference = (slug: string, title: string, abstract: string) => ({
	type: "topic",
	kind: "article",
	role: "collectionGroup",
	title,
	url: `${PATH}/${slug}`,
	abstract: [{ type: "text", text: abstract }],
});

// Trimmed from Apple's TechnologyOverviews.json and index/technologyoverviews (2026-10-06)
const overviewsData = {
	topicSections: [
		{
			title: "Get started",
			identifiers: ["doc://TO/app-design-and-ui", "doc://TO/games"],
			anchor: "Get-started",
		},
		{
			title: "Discover Apple technologies",
			identifiers: ["doc://TO/data-management"],
			anchor: "Discover-Apple-technologies",
		},
	],
	references: {
		"doc://TO/app-design-and-ui": reference(
			"app-design-and-ui",
			"App design and UI",
			"Build your app’s interface.",
		),
		"doc://TO/games": reference("games", "Games", "Deliver game experiences."),
		"doc://TO/data-management": reference(
			"data-management",
			"Data management",
			"Persist your data.",
		),
	},
};

const overviewsIndex = {
	interfaceLanguages: {
		swift: [
			{
				type: "module",
				title: "Technology Overviews",
				path: PATH,
				children: [
					{ type: "groupMarker", title: "Get started" },
					{
						type: "collection",
						title: "App design and UI",
						path: `${PATH}/app-design-and-ui`,
						children: [
							{ type: "groupMarker", title: "App builder" },
							{
								type: "article",
								title: "SwiftUI apps",
								path: `${PATH}/swiftui`,
							},
							{
								type: "article",
								title: "UIKit and AppKit apps",
								path: `${PATH}/uikit-appkit`,
							},
							{ type: "groupMarker", title: "Interface" },
							{
								type: "collection",
								title: "Liquid Glass",
								path: `${PATH}/liquid-glass`,
								children: [
									{ type: "groupMarker", title: "Essentials" },
									{
										type: "article",
										title: "Adopting Liquid Glass",
										path: `${PATH}/adopting-liquid-glass`,
									},
								],
							},
						],
					},
					{
						type: "collection",
						title: "Games",
						path: `${PATH}/games`,
						children: [
							{ type: "groupMarker", title: "Porting" },
							{
								type: "article",
								title: "Building your macOS game remotely from your PC",
								path: `${PATH}/building-your-macos-game-remotely-from-your-pc`,
							},
						],
					},
					{ type: "groupMarker", title: "Discover Apple technologies" },
					{
						type: "collection",
						title: "Data management",
						path: `${PATH}/data-management`,
						children: [
							{ type: "groupMarker", title: "Persistence and sharing" },
							{
								type: "article",
								title: "Shared data",
								path: `${PATH}/shared-data`,
							},
						],
					},
				],
			},
		],
	},
};

/** The pages Apple answers with: the overviews page and its navigator index */
export interface OverviewAnswers {
	data: unknown;
	index: unknown;
}

export const fullAnswers: OverviewAnswers = {
	data: overviewsData,
	index: overviewsIndex,
};

export const nothingListed: OverviewAnswers = {
	data: { topicSections: [], references: {} },
	index: { interfaceLanguages: { swift: [] } },
};

export const answerFor = (url: string, answers: OverviewAnswers): unknown => {
	if (url.includes("TechnologyOverviews.json")) {
		return answers.data;
	}
	if (url.includes("index/technologyoverviews")) {
		return answers.index;
	}
	throw new Error("Unknown URL");
};
