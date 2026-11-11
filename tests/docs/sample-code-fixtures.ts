export const sampleCodeContent = {
	metadata: {
		role: "collection",
		title: "Sample Code Library",
	},
	abstract: [
		{
			type: "text",
			text: "Enhance and expand your knowledge of Apple technologies by exploring the full library of sample code projects.",
		},
	],
	primaryContentSections: [
		{
			kind: "content",
			content: [
				{
					type: "heading",
					text: "Featured at WWDC25",
					anchor: "Featured-at-WWDC25",
					level: 2,
				},
				{
					type: "links",
					items: [
						"doc://com.apple.documentation/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass",
						"doc://com.apple.documentation/documentation/StoreKit/understanding-storekit-workflows",
					],
					style: "detailedGrid",
				},
			],
		},
	],
	topicSections: [
		{
			anchor: "WWDC25",
			title: "WWDC25",
			identifiers: [
				"doc://com.apple.documentation/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass",
				"doc://com.apple.documentation/documentation/StoreKit/understanding-storekit-workflows",
				"doc://com.apple.documentation/documentation/FoundationModels/adding-intelligent-app-features-with-generative-models",
			],
		},
		{
			anchor: "SwiftUI",
			title: "SwiftUI",
			identifiers: [
				"doc://com.apple.documentation/documentation/SwiftUI/Landmarks-Building-an-app-with-Liquid-Glass",
				"doc://com.apple.documentation/documentation/SwiftUI/building-rich-swiftui-text-experiences",
			],
		},
	],
};

export const sampleCodeIndex = {
	interfaceLanguages: {
		swift: [
			{
				path: "/documentation/samplecode",
				title: "Sample Code Library",
				type: "module",
				children: [
					{
						title: "WWDC25",
						type: "groupMarker",
					},
					{
						path: "/documentation/foundationmodels/adding-intelligent-app-features-with-generative-models",
						title: "Adding intelligent app features with generative models",
						type: "sampleCode",
						external: true,
						beta: true,
					},
					{
						path: "/documentation/storekit/understanding-storekit-workflows",
						title: "Understanding StoreKit workflows",
						type: "sampleCode",
						external: true,
						beta: false,
					},
					{
						title: "SwiftUI",
						type: "groupMarker",
					},
					{
						path: "/documentation/swiftui/landmarks-building-an-app-with-liquid-glass",
						title: "Landmarks: Building an app with Liquid Glass",
						type: "sampleCode",
						external: true,
						beta: false,
					},
					{
						path: "/documentation/swiftui/building-rich-swiftui-text-experiences",
						title: "Building rich SwiftUI text experiences",
						type: "sampleCode",
						external: true,
						beta: true,
					},
				],
			},
		],
	},
};
