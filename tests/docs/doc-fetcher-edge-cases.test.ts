import { beforeEach, describe, expect, it } from "bun:test";

import { apiCache } from "../../src/core/cache.ts";
import { AppError, ErrorType } from "../../src/core/errors.ts";
import { fetchAppleDocJson } from "../../src/docs/doc-fetcher.ts";
import { mockData } from "../helpers/test-helpers.ts";
import { spyOnHttpClient } from "../mocks/http-client.mock.ts";
import { mockDocUrl } from "./doc-fetcher-fixtures.ts";

const failure = async (): Promise<string> =>
	String(
		await fetchAppleDocJson({ url: mockDocUrl }).catch(
			(error: unknown) => error,
		),
	);

describe("fetchAppleDocJson edge cases", () => {
	let http: ReturnType<typeof spyOnHttpClient>;

	beforeEach(() => {
		apiCache.clear();
		http = spyOnHttpClient();
	});

	describe("error handling", () => {
		it("should handle network errors", async () => {
			http.getJson.mockRejectedValue(new Error("Network error"));

			expect(await failure()).toContain(
				"Failed to get Apple doc content: Network error",
			);
		});

		it("should handle 404 errors", async () => {
			http.getJson.mockRejectedValue(new Error("404 Not Found"));

			expect(await failure()).toContain(
				"Failed to get Apple doc content: 404 Not Found",
			);
		});

		it("keeps the suggestions of the failure it wraps", async () => {
			http.getJson.mockRejectedValue(
				new AppError({
					type: ErrorType.NOT_FOUND,
					message: "Gone",
					suggestions: ["Search for it"],
				}),
			);

			const thrown = await fetchAppleDocJson({ url: mockDocUrl }).catch(
				(error: unknown) => error,
			);

			expect(thrown).toMatchObject({
				type: "NOT_FOUND",
				message: "Failed to get Apple doc content: Gone",
				suggestions: ["Search for it"],
			});
		});

		it("should handle malformed JSON", async () => {
			http.getJson.mockResolvedValue({});

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(result).toBe("# Documentation");
		});

		it("should leave out the link back to the input URL, empty sections and blank-line runs", async () => {
			http.getJson.mockResolvedValue({
				...mockData.docJsonData,
				metadata: { ...mockData.docJsonData.metadata, platforms: [] },
				seeAlsoSections: [{ title: "Nothing", identifiers: [] }],
				primaryContentSections: [
					{
						kind: "content",
						content: [
							{
								type: "codeListing",
								syntax: "swift",
								code: ["let a = 1", "", "", "let b = 2"],
							},
						],
					},
				],
			});

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(result).not.toContain("View full documentation");
			expect(result).not.toContain(mockDocUrl);
			expect(result).not.toContain("## Platform Availability");
			expect(result).not.toContain("## See Also");
			expect(result.replaceAll(/```[\s\S]*?```/gu, "")).not.toContain("\n\n\n");
			expect(result).toContain("let a = 1\n\n\nlet b = 2");
			expect(result.endsWith("\n")).toBe(false);
		});

		it("should handle missing metadata", async () => {
			http.getJson.mockResolvedValue({
				primaryContentSections: [
					{
						kind: "content",
						content: [
							{
								type: "paragraph",
								inlineContent: [
									{ type: "text", text: "Some content without metadata." },
								],
							},
						],
					},
				],
			});

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(result).toContain("Some content without metadata");
			expect(result).not.toContain("**Type:**");
			expect(result).not.toContain("**Module:**");
		});
	});

	describe("special features", () => {
		it("should handle beta and deprecated flags", async () => {
			http.getJson.mockResolvedValue({
				...mockData.docJsonData,
				metadata: {
					...mockData.docJsonData.metadata,
					beta: true,
					deprecated: true,
					deprecationSummary: [{ type: "text", text: "Use NewAPI instead." }],
				},
			});

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(result).toContain("# UIView");
			expect(result).toContain("**Class**");
		});

		it("should handle availability information", async () => {
			http.getJson.mockResolvedValue({
				...mockData.docJsonData,
				metadata: {
					...mockData.docJsonData.metadata,
					platforms: [
						{ name: "iOS", introducedAt: "13.0", current: "17.0", beta: true },
						{
							name: "macOS",
							introducedAt: "10.15",
							deprecatedAt: "13.0",
							current: "14.0",
						},
						{ name: "watchOS", introducedAt: "6.0", current: "10.0" },
					],
					required: true,
				},
			});

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(result).toContain("# UIView");
			expect(result).toContain("**Beta**");
			expect(result).toContain("Platform Availability");
			expect(result).toContain("iOS");
			expect(result).toContain("13.0+");
		});

		it("should handle code samples", async () => {
			http.getJson.mockResolvedValue({
				...mockData.docJsonData,
				sampleCodeDownload: {
					url: "https://docs-assets.developer.apple.com/published/sample.zip",
					action: { overridingTitle: "Download Sample Code" },
				},
				primaryContentSections: [
					{
						kind: "content",
						content: [
							{
								type: "codeListing",
								syntax: "swift",
								code: ["let view = UIView()", "view.backgroundColor = .red"],
							},
						],
					},
				],
			});

			const result = await fetchAppleDocJson({ url: mockDocUrl });

			expect(result).toContain("# UIView");
			expect(result).toContain("**Class**");
			expect(result).toContain("## Overview");
		});
	});
});
