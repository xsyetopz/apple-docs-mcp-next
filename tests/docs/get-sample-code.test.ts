import { beforeEach, describe, expect, it } from "bun:test";

import { generateUrlCacheKey, sampleCodeCache } from "../../src/core/cache.ts";
import { APPLE_URLS } from "../../src/core/constants.ts";
import {
	handleGetSampleCode,
	type SampleCodeQuery,
} from "../../src/docs/get-sample-code.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import { sampleCodeContent, sampleCodeIndex } from "./sample-code-fixtures.ts";

const query = (overrides: Partial<SampleCodeQuery> = {}): SampleCodeQuery => ({
	framework: undefined,
	beta: "include",
	searchQuery: undefined,
	limit: 50,
	...overrides,
});

const cacheKey = (request: SampleCodeQuery): string =>
	generateUrlCacheKey("sample-code", { ...request });

describe("handleGetSampleCode", () => {
	let http: ReturnType<typeof spyOnHttpClient>;

	beforeEach(() => {
		sampleCodeCache.clear();
		http = spyOnHttpClient();
		http.getJson.mockResolvedValue({ sections: [] });
		http.get.mockImplementation((url) =>
			Promise.resolve(
				Response.json(
					url === APPLE_URLS.SAMPLE_CODE_JSON
						? sampleCodeContent
						: sampleCodeIndex,
				),
			),
		);
	});

	it("should fetch and return sample code data", async () => {
		const result = await handleGetSampleCode(query());

		expect(http.get).toHaveBeenCalledTimes(2);
		expect(http.get).toHaveBeenCalledWith(APPLE_URLS.SAMPLE_CODE_JSON);
		expect(http.get).toHaveBeenCalledWith(APPLE_URLS.SAMPLE_CODE_INDEX_JSON);
		expect(result).toContain("Apple Sample Code Library");
		expect(result).toContain("4 sample code projects");
		expect(result).toContain("Landmarks: Building an app with Liquid Glass");
		expect(result).toContain("Understanding StoreKit workflows");
		expect(result).not.toContain("Showing");
	});

	it("should filter by framework", async () => {
		const result = await handleGetSampleCode(query({ framework: "SwiftUI" }));

		expect(result).not.toContain("Framework:");
		expect(result).toContain("2 sample code projects");
		expect(result).toContain("## SwiftUI");
		expect(result).not.toContain("Understanding StoreKit workflows");
	});

	it("should filter beta samples when beta=exclude", async () => {
		const result = await handleGetSampleCode(query({ beta: "exclude" }));

		expect(result).not.toContain("Beta: exclude");
		expect(result).toContain("2 sample code projects");
		expect(result).not.toContain("Adding intelligent app features");
		expect(result).not.toContain("Building rich SwiftUI text experiences");
		expect(result).toContain("Understanding StoreKit workflows");
		expect(result).toContain("Landmarks: Building an app with Liquid Glass");
	});

	it("says how many are not shown when limit cuts the list", async () => {
		const result = await handleGetSampleCode(query({ limit: 1 }));

		expect(result).toContain("4 sample code projects");
		expect(result).toContain(
			"Showing 1 of 4. Narrow with searchQuery or framework, or raise limit.",
		);
	});

	it("should return cached results when available", async () => {
		const cachedResult = "# Cached Sample Code Data";
		sampleCodeCache.set(cacheKey(query()), cachedResult);

		const result = await handleGetSampleCode(query());

		expect(result).toBe(cachedResult);
		expect(http.get).not.toHaveBeenCalled();
	});

	it("should cache results after fetching", async () => {
		const request = query({
			framework: "SwiftUI",
			beta: "exclude",
			searchQuery: "test",
			limit: 10,
		});

		const result = await handleGetSampleCode(request);

		expect(sampleCodeCache.get(cacheKey(request))).toBe(result);
	});

	it("should handle API errors gracefully", async () => {
		http.get.mockRejectedValue(new Error("Network error"));

		const error = await handleGetSampleCode(query()).catch(
			(error_: unknown) => error_,
		);

		expect(error).toEqual(new Error("Network error"));
	});

	it("should handle non-200 status codes", async () => {
		http.get.mockResolvedValue(
			new Response("", { status: 404, statusText: "Not Found" }),
		);

		const error = await handleGetSampleCode(query()).catch(
			(error_: unknown) => error_,
		);

		expect(error).toEqual(
			new Error("Failed to fetch sample code content: Not Found"),
		);
	});
});
