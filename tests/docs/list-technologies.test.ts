import { beforeEach, describe, expect, it } from "bun:test";

import { technologiesCache } from "../../src/core/cache.ts";
import {
	handleListTechnologies,
	type TechnologiesQuery,
} from "../../src/docs/list-technologies.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import {
	betaReferences,
	group,
	tech,
	technologiesPage,
} from "./technologies-fixtures.ts";

const defaultQuery: TechnologiesQuery = {
	category: undefined,
	language: undefined,
	includeBeta: true,
	limit: 200,
};

const mockTechnologiesResponse = technologiesPage([
	group("Featured", [
		tech("SwiftUI", "swiftui", ["swift"]),
		tech("UIKit", "uikit", ["swift", "occ"]),
	]),
	group("App Frameworks", [tech("Foundation", "foundation", ["swift", "occ"])]),
]);

describe("list-technologies", () => {
	let http: ReturnType<typeof spyOnHttpClient>;

	beforeEach(() => {
		technologiesCache.clear();
		http = spyOnHttpClient();
	});

	describe("handleListTechnologies", () => {
		it("should list all technologies without filters", async () => {
			http.getJson.mockResolvedValue(mockTechnologiesResponse);

			const result = await handleListTechnologies(defaultQuery);

			expect(http.getJson).toHaveBeenCalledWith(
				"https://developer.apple.com/tutorials/data/documentation/technologies.json",
			);
			expect(result).toContain("# Apple Developer Technologies");
			expect(result).toContain("## Featured");
			expect(result).toContain("SwiftUI (swiftui) [swift]; UIKit (uikit)");
			expect(result).toContain("## App Frameworks");
			expect(result).toContain("Foundation (foundation)");
			expect(result).toContain("3 technologies");
			expect(result).toContain("pass category");
		});

		it("should filter by category", async () => {
			http.getJson.mockResolvedValue(mockTechnologiesResponse);

			const result = await handleListTechnologies({
				...defaultQuery,
				category: "app frameworks",
			});

			expect(result).toContain("## App Frameworks");
			expect(result).toContain("- Foundation (foundation)");
			expect(result).not.toContain("## Featured");
			expect(result).not.toContain("SwiftUI");
		});

		it("should handle case-insensitive category filtering", async () => {
			http.getJson.mockResolvedValue(mockTechnologiesResponse);

			const result = await handleListTechnologies({
				...defaultQuery,
				category: "APP FRAMEWORKS",
			});

			expect(result).toContain("## App Frameworks");
			expect(result).toContain("Foundation (foundation)");
		});

		it("should filter by language", async () => {
			http.getJson.mockResolvedValue(
				technologiesPage([
					group("Featured", [
						tech("SwiftUI", "swiftui", ["swift"]),
						tech("Core Foundation", "corefoundation", ["occ"]),
					]),
				]),
			);

			const result = await handleListTechnologies({
				...defaultQuery,
				language: "swift",
			});

			expect(result).toContain("SwiftUI (swiftui)");
			expect(result).not.toContain("Core Foundation");
		});

		it("should exclude beta technologies when includeBeta is false", async () => {
			http.getJson.mockResolvedValue(
				technologiesPage(
					[
						group("Featured", [
							tech("SwiftUI", "swiftui", ["swift"]),
							tech("UIKit", "uikit", ["swift", "occ"]),
						]),
					],
					betaReferences("swiftui"),
				),
			);

			const result = await handleListTechnologies({
				...defaultQuery,
				includeBeta: false,
			});

			expect(result).not.toContain("SwiftUI");
			expect(result).toContain("UIKit (uikit)");
		});

		it("should handle empty response", async () => {
			http.getJson.mockResolvedValue({ references: {}, sections: [] });

			const result = await handleListTechnologies(defaultQuery);

			expect(result).toContain(
				"No technologies found matching the specified criteria.",
			);
		});

		it("should handle fetch errors", async () => {
			http.getJson.mockRejectedValue(new Error("Network error"));

			const error = await handleListTechnologies(defaultQuery).catch(
				(error_: unknown) => error_,
			);

			expect(error).toEqual(new Error("Network error"));
		});

		it("should report malformed JSON as an error", async () => {
			http.getJson.mockResolvedValue({ invalid: "response" });

			const error = await handleListTechnologies(defaultQuery).catch(
				(error_: unknown) => error_,
			);

			expect(error).toBeInstanceOf(TypeError);
		});

		it("should return detailed technology information when available", async () => {
			http.getJson.mockResolvedValue(
				technologiesPage([
					group("Graphics & Games", [
						tech("Metal", "metal", ["swift", "occ"], ["Graphics", "Games"]),
					]),
				]),
			);

			const result = await handleListTechnologies(defaultQuery);

			expect(result).toContain("Metal (metal)");
			expect(result).not.toContain("Graphics, Games");
			expect(result).toContain("pass category");
		});

		it("should list a technology's tags when the category matched by tag", async () => {
			http.getJson.mockResolvedValue(
				technologiesPage([
					group("Graphics & Games", [
						tech("Metal", "metal", ["swift", "occ"], ["Graphics", "Games"]),
					]),
				]),
			);

			const result = await handleListTechnologies({
				...defaultQuery,
				category: "games",
			});

			expect(result).toContain("- Metal (metal) [swift, occ]: Graphics, Games");
		});

		it("should mark beta technologies", async () => {
			http.getJson.mockResolvedValue(
				technologiesPage(
					[group("Featured", [tech("SwiftUI", "swiftui", ["swift"])])],
					betaReferences("swiftui"),
				),
			);

			const result = await handleListTechnologies(defaultQuery);

			expect(result).toContain("SwiftUI (swiftui) (beta)");
			expect(result).toContain("1 technologies (1 in beta)");
		});

		it("should apply the limit to each category", async () => {
			http.getJson.mockResolvedValue(
				technologiesPage([
					group("UI Frameworks", [
						tech("SwiftUI", "swiftui", ["swift"], ["UI"]),
						tech("UIKit", "uikit", ["swift", "occ"], ["UI"]),
						tech("AppKit", "appkit", ["swift", "occ"], ["UI"]),
					]),
					group("Data Frameworks", [
						tech("Core Data", "coredata", ["swift", "occ"], ["Data"]),
						tech("CloudKit", "cloudkit", ["swift", "occ"], ["Data"]),
					]),
				]),
			);

			const result = await handleListTechnologies({
				...defaultQuery,
				limit: 2,
			});

			expect(result).toContain("SwiftUI");
			expect(result).toContain("UIKit");
			expect(result).not.toContain("AppKit");
			expect(result).toContain("Core Data");
			expect(result).toContain("CloudKit");
			expect(result).toContain("4 technologies");
			expect(result).toContain("1 more not shown");
			expect(result).toContain("raise limit");
		});

		it("should list every category under the limit", async () => {
			http.getJson.mockResolvedValue(
				technologiesPage([
					group("Group A", [
						tech("Tech 1", "tech1", ["swift"]),
						tech("Tech 2", "tech2", ["swift"]),
					]),
					group("Group B", [
						tech("Tech 3", "tech3", ["swift"]),
						tech("Tech 4", "tech4", ["swift"]),
					]),
				]),
			);

			const result = await handleListTechnologies({
				...defaultQuery,
				limit: 1,
			});

			expect(result).toContain("Tech 1 (tech1)");
			expect(result).not.toContain("Tech 2");
			expect(result).toContain("Tech 3 (tech3)");
			expect(result).not.toContain("Tech 4");
			expect(result).toContain("2 technologies");
			expect(result).toContain("2 more not shown");
		});

		it("should handle zero limit", async () => {
			http.getJson.mockResolvedValue(mockTechnologiesResponse);

			const result = await handleListTechnologies({
				...defaultQuery,
				limit: 0,
			});

			expect(result).toContain(
				"No technologies found matching the specified criteria.",
			);
		});
	});
});
