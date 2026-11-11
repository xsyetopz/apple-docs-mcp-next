/**
 * Apple's Technology Overviews, read from its navigator index: groups of collections, each with its own articles.
 */
import { beforeEach, describe, expect, it } from "bun:test";

import {
	generateUrlCacheKey,
	technologyOverviewsCache,
} from "../../src/core/cache.ts";
import { handleGetTechnologyOverviews } from "../../src/docs/get-technology-overviews.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import {
	answerFor,
	fullAnswers,
	nothingListed,
} from "./technology-overviews-fixtures.ts";

const defaultQuery = {
	category: undefined,
	searchQuery: undefined,
	includeSubcategories: true,
	limit: 50,
};

const links = (result: string): string[] =>
	[
		...result.matchAll(
			/\[([^\]]+)\]\(\/documentation\/technologyoverviews\//gu,
		),
	].map((match) => match[1] ?? "");

describe("get-technology-overviews", () => {
	let http: ReturnType<typeof spyOnHttpClient>;

	beforeEach(() => {
		technologyOverviewsCache.clear();
		http = spyOnHttpClient();
		http.getJson.mockImplementation((url) =>
			Promise.resolve(answerFor(url, fullAnswers)),
		);
	});

	it("lists each group, its collections with their summaries, and every article under its own collection", async () => {
		const result = await handleGetTechnologyOverviews(defaultQuery);

		expect(links(result)).toEqual([
			"App design and UI",
			"SwiftUI apps",
			"UIKit and AppKit apps",
			"Liquid Glass",
			"Adopting Liquid Glass",
			"Games",
			"Building your macOS game remotely from your PC",
			"Data management",
			"Shared data",
		]);
		const order = [
			"## Get started",
			"- [App design and UI]",
			"Build your app’s interface.",
			"**App builder**",
			"[SwiftUI apps]",
			"**Interface**",
			"[Liquid Glass]",
			"**Essentials**",
			"[Adopting Liquid Glass]",
			"- [Games]",
			"## Discover Apple technologies",
			"- [Data management]",
			"[Shared data]",
		].map((text) => result.indexOf(text));
		expect(order.every((index) => index >= 0)).toBe(true);
		expect(order).toEqual(order.toSorted((a, b) => a - b));
	});

	it("gives a category with all its articles, those of its nested collections included", async () => {
		const result = await handleGetTechnologyOverviews({
			...defaultQuery,
			category: "app-design-and-ui",
		});
		const nested = await handleGetTechnologyOverviews({
			...defaultQuery,
			category: "liquid-glass",
		});

		expect(links(result)).toEqual([
			"App design and UI",
			"SwiftUI apps",
			"UIKit and AppKit apps",
			"Liquid Glass",
			"Adopting Liquid Glass",
		]);
		expect(links(nested)).toEqual(["Liquid Glass", "Adopting Liquid Glass"]);
	});

	it("counts every entry it prints against the limit", async () => {
		const result = await handleGetTechnologyOverviews({
			...defaultQuery,
			limit: 3,
		});

		expect(links(result)).toEqual([
			"App design and UI",
			"SwiftUI apps",
			"UIKit and AppKit apps",
		]);
		expect(result).toContain(
			"Showing 3 of 9. Narrow with category or searchQuery, or raise limit.",
		);
	});

	it("does not mention a cap when everything fits", async () => {
		const result = await handleGetTechnologyOverviews(defaultQuery);

		expect(result).not.toContain("Showing");
		expect(result).not.toContain("###");
	});

	it("lists only the collections without subcategories", async () => {
		const result = await handleGetTechnologyOverviews({
			...defaultQuery,
			includeSubcategories: false,
		});

		expect(links(result)).toEqual([
			"App design and UI",
			"Liquid Glass",
			"Games",
			"Data management",
		]);
	});

	it("finds entries by title or summary, naming the collection each is in", async () => {
		const result = await handleGetTechnologyOverviews({
			...defaultQuery,
			searchQuery: "liquid",
		});

		expect(links(result)).toEqual(["Liquid Glass", "Adopting Liquid Glass"]);
		expect(result).toContain(
			"[Adopting Liquid Glass](/documentation/technologyoverviews/adopting-liquid-glass) *(Article)* — in Liquid Glass",
		);
	});

	it("names the categories when the one asked for does not exist", async () => {
		const result = await handleGetTechnologyOverviews({
			...defaultQuery,
			category: "nope",
		});

		expect(result).toBe(
			'No technology overview matches category "nope". Categories: app-design-and-ui, liquid-glass, games, data-management.',
		);
	});

	it("uses the cached answer when there is one", async () => {
		technologyOverviewsCache.set(
			generateUrlCacheKey("technology-overviews", defaultQuery),
			"cached",
		);

		const result = await handleGetTechnologyOverviews(defaultQuery);

		expect(result).toBe("cached");
		expect(http.getJson).not.toHaveBeenCalled();
	});

	it("caches its answer", async () => {
		const result = await handleGetTechnologyOverviews(defaultQuery);

		expect(
			technologyOverviewsCache.get(
				generateUrlCacheKey("technology-overviews", defaultQuery),
			),
		).toBe(result);
	});

	it("says so when Apple lists nothing", async () => {
		http.getJson.mockImplementation((url) =>
			Promise.resolve(answerFor(url, nothingListed)),
		);

		const result = await handleGetTechnologyOverviews(defaultQuery);

		expect(result).toBe(
			"No technology overviews found matching the specified criteria.",
		);
	});

	it("reports a failed request", async () => {
		http.getJson.mockRejectedValue(new Error("Network error"));

		const error = await handleGetTechnologyOverviews(defaultQuery).catch(
			(error_: unknown) => error_,
		);

		expect(error).toEqual(new Error("Network error"));
	});
});
