/**
 * The search_wwdc_content use cases, over a mocked data source
 */
import { beforeEach, describe, expect, test } from "bun:test";

import { handleSearchWWDCContent } from "../../src/wwdc/search-wwdc-content.ts";
import type { WWDCVideo } from "../../src/wwdc/types.ts";
import {
	answerVideos,
	type DataSourceSpies,
	makeIndexed,
	makeMetadata,
	makeVideo,
	makeYearIndex,
	rejectionOf,
	spyOnDataSource,
} from "./wwdc-fixtures.ts";

const searchVideo: WWDCVideo = makeVideo({
	transcript: {
		fullText:
			"Welcome to Meet the Translation API\nToday we will explore async await patterns",
		segments: [
			{ timestamp: "00:00", text: "Welcome to Meet the Translation API" },
			{
				timestamp: "00:30",
				text: "Today we will explore async await patterns",
			},
		],
	},
	codeExamples: [
		{
			language: "swift",
			title: "Basic Translation",
			code: 'let translation = await translator.translate("Hello")',
		},
	],
});

const query = {
	query: "translate",
	searchIn: "both",
	year: undefined,
	language: undefined,
	limit: 20,
} as const;

describe("handleSearchWWDCContent", () => {
	let spies: DataSourceSpies;

	beforeEach(() => {
		spies = spyOnDataSource();
		spies.loadGlobalMetadata.mockResolvedValue(
			makeMetadata({ years: ["2025", "2024"] }),
		);
		spies.loadYearIndex.mockResolvedValue(makeYearIndex([makeIndexed()]));
		answerVideos(spies, [searchVideo]);
	});

	test("should search in transcripts", async () => {
		const result = await handleSearchWWDCContent({
			...query,
			query: "async await",
			searchIn: "transcript",
		});

		expect(result).toContain("WWDC content matches");
		expect(result).toContain("Meet the Translation API");
		expect(result).toContain("async await patterns");
		expect(spies.loadVideoData).toHaveBeenCalled();
	});

	test("should search in code examples", async () => {
		const result = await handleSearchWWDCContent({
			...query,
			query: "translator",
			searchIn: "code",
		});

		expect(result).toContain("WWDC content matches");
		expect(result).toContain("Basic Translation\n```swift");
		expect(result).toContain("translator.translate");
	});

	test("should search in both transcript and code", async () => {
		const result = await handleSearchWWDCContent(query);

		expect(result).toContain("Meet the Translation API");
		expect(result).toContain("translator.translate");
	});

	test("should filter by year", async () => {
		const result = await handleSearchWWDCContent({ ...query, year: "2025" });

		expect(result).toContain("Meet the Translation API");
		expect(spies.loadYearIndex).toHaveBeenCalledWith("2025");
		expect(spies.loadYearIndex).toHaveBeenCalledTimes(1);
	});

	test("should filter by language", async () => {
		const result = await handleSearchWWDCContent({
			...query,
			searchIn: "code",
			language: "swift",
		});

		expect(result).toContain("Basic Translation");
		expect(result).toContain("```swift");
	});

	test("caps a transcript snippet near 300 chars around the match", async () => {
		const filler = "word ".repeat(200);
		answerVideos(spies, [
			makeVideo({
				transcript: {
					fullText: `${filler}the async await pattern ${filler}`,
					segments: [],
				},
			}),
		]);
		spies.loadYearIndex.mockResolvedValue(
			makeYearIndex([makeIndexed({ topics: [], hasCode: false })]),
		);

		const result = await handleSearchWWDCContent({
			...query,
			query: "async await",
			searchIn: "transcript",
			year: "2025",
		});

		const line = result.split("\n").find((l) => l.startsWith("Transcript"));
		expect(line).toContain("async await pattern");
		expect(line?.includes("…")).toBe(true);
		expect(line?.length).toBeLessThan(330);
	});

	test("shows one heading line per session and no query echo", async () => {
		const result = await handleSearchWWDCContent({
			...query,
			query: "translator",
			searchIn: "code",
		});

		expect(result).toContain(
			"## [Meet the Translation API](https://developer.apple.com/videos/play/wwdc2025/10188/) (2025)",
		);
		expect(result).not.toContain("Search Query");
		expect(result).not.toContain("Search Scope");
	});

	test("ends with an actionable line when the limit cuts sessions", async () => {
		spies.loadYearIndex.mockResolvedValue(
			makeYearIndex(
				["10188", "10189"].map((id) =>
					makeIndexed({ id, topics: [], dataFile: `videos/2025-${id}.json` }),
				),
			),
		);
		answerVideos(spies, [
			{ ...searchVideo, id: "10188" },
			{ ...searchVideo, id: "10189" },
		]);

		const result = await handleSearchWWDCContent({
			...query,
			query: "translator",
			searchIn: "code",
			year: "2025",
			limit: 1,
		});

		expect(result).toContain("1 of 2 sessions");
		expect(result).toContain("Showing 1 of 2. Narrow with year or language");
	});

	test("should handle no results", async () => {
		const result = await handleSearchWWDCContent({
			...query,
			query: "nonexistent",
		});

		expect(result).toContain("No content found");
	});

	test("rejects with the failure", async () => {
		spies.loadGlobalMetadata.mockRejectedValue(new Error("Search failed"));

		expect(await rejectionOf(handleSearchWWDCContent(query))).toContain(
			"Search failed",
		);
	});
});
