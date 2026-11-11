/**
 * The get_wwdc_code_examples use cases, over a mocked data source
 */
import { beforeEach, describe, expect, test } from "bun:test";

import { handleGetWWDCCodeExamples } from "../../src/wwdc/get-wwdc-code-examples.ts";
import type { WWDCVideo } from "../../src/wwdc/types.ts";
import {
	answerVideos,
	type DataSourceSpies,
	makeIndexed,
	makeMetadata,
	makeVideo,
	makeYearIndex,
	spyOnDataSource,
} from "./wwdc-fixtures.ts";

const videosWithCode: WWDCVideo[] = [
	makeVideo({
		title: "SwiftUI Animations",
		duration: "30 min",
		topics: ["SwiftUI & UI Frameworks"],
		codeExamples: [
			{
				language: "swift",
				title: "Animation Example",
				code: "import SwiftUI\n\nwithAnimation { state.toggle() }",
			},
		],
	}),
	makeVideo({
		id: "10189",
		url: "https://developer.apple.com/videos/play/wwdc2025/10189/",
		title: "UIKit Updates",
		duration: "25 min",
		topics: ["UIKit"],
		codeExamples: [
			{
				language: "swift",
				title: "UIKit Example",
				code: "let view = UIView()",
			},
		],
	}),
];

const withoutCode = (video: WWDCVideo): WWDCVideo => ({
	...video,
	codeExamples: [],
});

const query = {
	framework: undefined,
	topic: undefined,
	year: undefined,
	language: undefined,
	limit: 30,
};

describe("handleGetWWDCCodeExamples", () => {
	let spies: DataSourceSpies;

	beforeEach(() => {
		spies = spyOnDataSource();
		spies.loadGlobalMetadata.mockResolvedValue(makeMetadata());
		spies.loadYearIndex.mockResolvedValue(
			makeYearIndex([
				makeIndexed({
					title: "SwiftUI Animations",
					topics: ["SwiftUI & UI Frameworks"],
				}),
				makeIndexed({
					id: "10189",
					title: "UIKit Updates",
					topics: ["UIKit"],
					dataFile: "videos/2025-10189.json",
				}),
			]),
		);
		answerVideos(spies, videosWithCode);
	});

	test("should get all code examples", async () => {
		const result = await handleGetWWDCCodeExamples(query);

		expect(result).toContain("2 of 2 code examples");
		expect(result).toContain(
			"### Animation Example · [SwiftUI Animations](https://developer.apple.com/videos/play/wwdc2025/10188/) · 2025",
		);
		expect(result).toContain("UIKit Example");
	});

	test("should filter by framework", async () => {
		const result = await handleGetWWDCCodeExamples({
			...query,
			framework: "SwiftUI",
		});

		expect(result).toContain("Animation Example");
		expect(result).not.toContain("UIKit Example");
	});

	test("should filter by language", async () => {
		const result = await handleGetWWDCCodeExamples({
			...query,
			language: "swift",
		});

		expect(result).toContain("Animation Example");
		expect(result).toContain("```swift");
		expect(result).not.toContain("Language: swift");
	});

	test("should handle no code examples", async () => {
		answerVideos(
			spies,
			videosWithCode.map((v) => withoutCode(v)),
		);

		const result = await handleGetWWDCCodeExamples(query);

		expect(result).toContain("No code examples found");
	});
});
