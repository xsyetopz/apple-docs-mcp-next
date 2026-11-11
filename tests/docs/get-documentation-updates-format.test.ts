import { beforeEach, describe, expect, it } from "bun:test";

import { updatesCache } from "../../src/core/cache.ts";
import { handleGetDocumentationUpdates } from "../../src/docs/get-documentation-updates.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import {
	type GetJsonSpy,
	query,
	routeUpdates,
	updatesData,
	updatesIndex,
} from "./get-documentation-updates.fixtures.ts";

const noResults =
	"No documentation updates found matching the specified criteria.";

describe("get-documentation-updates output and cache", () => {
	let getJson: GetJsonSpy;

	beforeEach(() => {
		updatesCache.clear();
		({ getJson } = spyOnHttpClient());
		routeUpdates(getJson, updatesData, updatesIndex);
	});

	it("should show new badges", async () => {
		const result = await handleGetDocumentationUpdates(
			query({ category: "wwdc" }),
		);

		expect(result).toContain("WWDC24");
		expect(result).toContain("(New, 2024)");
	});

	it("should use cache when available", async () => {
		const first = await handleGetDocumentationUpdates(query());
		getJson.mockClear();

		const second = await handleGetDocumentationUpdates(query());

		expect(getJson).not.toHaveBeenCalled();
		expect(second).toBe(first);
	});

	it("should store results in cache", async () => {
		await handleGetDocumentationUpdates(query({ limit: 10 }));

		expect(updatesCache.size).toBe(1);
		expect([...updatesCache.keys()].join(",")).toContain(
			"documentation-updates",
		);
		expect([...updatesCache.values()].join(",")).toContain(
			"Apple Developer Documentation Updates",
		);
	});

	it("should handle empty results", async () => {
		routeUpdates(
			getJson,
			{ topicSections: [], references: {} },
			{ interfaceLanguages: { swift: [] } },
		);

		const result = await handleGetDocumentationUpdates(query());

		expect(result).toBe(noResults);
	});

	it("rejects with the failure", async () => {
		getJson.mockRejectedValue(new Error("Network error"));

		const error = await handleGetDocumentationUpdates(query()).catch(
			(error_: unknown) => error_,
		);

		expect(error).toEqual(new Error("Network error"));
	});

	it("should handle partial data correctly", async () => {
		routeUpdates(
			getJson,
			{
				topicSections: [
					{
						title: "WWDC",
						identifiers: [
							"doc://com.apple.Updates/documentation/Updates/wwdc2024",
						],
						anchor: "WWDC",
					},
				],
				references: {},
			},
			updatesIndex,
		);

		const result = await handleGetDocumentationUpdates(query());

		expect(result).toBe(noResults);
	});

	it("should extract technology from path correctly", async () => {
		const result = await handleGetDocumentationUpdates(
			query({ category: "technology" }),
		);

		expect(result).toContain("SwiftUI updates");
		expect(result).toContain("(Beta)");
	});

	it("should group updates by category", async () => {
		const result = await handleGetDocumentationUpdates(query());

		const wwdcIndex = result.indexOf("## WWDC");
		const techIndex = result.indexOf("## Technology Updates");
		const releaseIndex = result.indexOf("## Release Notes");

		expect(wwdcIndex).toBeGreaterThan(-1);
		expect(wwdcIndex).toBeLessThan(techIndex);
		expect(techIndex).toBeLessThan(releaseIndex);
	});

	it("files a WWDC listed under Past releases as wwdc, with its year", async () => {
		routeUpdates(
			getJson,
			{
				topicSections: [
					{
						title: "Past releases",
						identifiers: [
							"doc://com.apple.Updates/documentation/Updates/wwdc2025",
						],
						anchor: "Past-releases",
					},
				],
				references: {
					"doc://com.apple.Updates/documentation/Updates/wwdc2025": {
						type: "topic",
						title: "WWDC25",
						url: "/documentation/updates/wwdc2025",
						kind: "article",
						abstract: [
							{
								type: "text",
								text: "Highlights of new technologies introduced at WWDC25.",
							},
						],
					},
				},
			},
			{
				interfaceLanguages: {
					swift: [
						{
							path: "/documentation/updates",
							title: "Updates",
							type: "module",
							children: [
								{
									path: "/documentation/updates/wwdc2025",
									title: "WWDC25",
									type: "article",
								},
							],
						},
					],
				},
			},
		);

		const result = await handleGetDocumentationUpdates(
			query({ category: "wwdc", year: "2025" }),
		);

		expect(result).toContain("## WWDC");
		expect(result).toContain("[WWDC25](/documentation/updates/wwdc2025)");
		expect(result).toContain("(2025)");
		expect(result).not.toContain("Technology:");
	});
});
