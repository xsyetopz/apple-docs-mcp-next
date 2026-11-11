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

describe("get-documentation-updates filters", () => {
	let getJson: GetJsonSpy;

	beforeEach(() => {
		updatesCache.clear();
		({ getJson } = spyOnHttpClient());
		routeUpdates(getJson, updatesData, updatesIndex);
	});

	it("should fetch and format documentation updates", async () => {
		const result = await handleGetDocumentationUpdates(query());

		expect(getJson).toHaveBeenCalledTimes(2);
		expect(result).toContain("Apple Developer Documentation Updates");
		expect(result).toContain("WWDC24");
		expect(result).toContain("SwiftUI updates");
		expect(result).toContain("UIKit updates");
	});

	it("should filter by category", async () => {
		const result = await handleGetDocumentationUpdates(
			query({ category: "wwdc" }),
		);

		expect(result).toContain("WWDC24");
		expect(result).toContain("WWDC23");
		expect(result).not.toContain("SwiftUI updates");
		expect(result).not.toContain("UIKit updates");
	});

	it("should filter by technology", async () => {
		const result = await handleGetDocumentationUpdates(
			query({ technology: "SwiftUI" }),
		);

		expect(result).toContain("SwiftUI updates");
		expect(result).not.toContain("UIKit updates");
		expect(result).not.toContain("WWDC24");
	});

	it("should filter by year for WWDC", async () => {
		const result = await handleGetDocumentationUpdates(
			query({ category: "wwdc", year: "2024" }),
		);

		expect(result).toContain("WWDC24");
		expect(result).not.toContain("WWDC23");
	});

	it("should filter release notes", async () => {
		const result = await handleGetDocumentationUpdates(
			query({ category: "release-notes" }),
		);

		expect(result).toContain("iOS & iPadOS Release Notes");
		expect(result).not.toContain("WWDC");
		expect(result).not.toContain("SwiftUI updates");
	});

	it("should exclude beta features when includeBeta is false", async () => {
		const result = await handleGetDocumentationUpdates(
			query({ category: "technology", includeBeta: false }),
		);

		expect(result).toContain("UIKit updates");
		expect(result).not.toContain("SwiftUI updates");
	});

	it("should include beta features when includeBeta is true", async () => {
		const result = await handleGetDocumentationUpdates(
			query({ category: "technology" }),
		);

		expect(result).toContain("UIKit updates");
		expect(result).toContain("SwiftUI updates");
		expect(result).toContain("(Beta)");
	});

	it("should search by query", async () => {
		const result = await handleGetDocumentationUpdates(
			query({ searchQuery: "SwiftUI" }),
		);

		expect(result).toContain("SwiftUI updates");
		expect(result).not.toContain("UIKit updates");
		expect(result).not.toContain("WWDC24");
	});

	it("should limit results", async () => {
		const result = await handleGetDocumentationUpdates(query({ limit: 2 }));

		const updateCount = result
			.split("\n")
			.filter((line) => line.startsWith("- [")).length;
		expect(updateCount).toBe(2);
		expect(result).toContain(
			"Showing 2 of 5. Narrow with category, technology or searchQuery, or raise limit.",
		);
	});
});
