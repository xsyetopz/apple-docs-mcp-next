/**
 * Tests for the resources, related videos and speakers of the WWDC content extractor
 */
import { beforeEach, describe, expect, test } from "bun:test";

import { extractVideoContent as extractWWDCVideoContent } from "../../../src/wwdc/extractors/content-extractor.ts";
import { spyOnHttpClient } from "../../mocks/http-client.mock.ts";

describe("WWDC Content Extractor page fields", () => {
	let http: ReturnType<typeof spyOnHttpClient>;

	beforeEach(() => {
		http = spyOnHttpClient();
	});

	test("should extract resources", async () => {
		const mockHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="video-title">
          <h1>Test Video</h1>
        </div>
        <nav><a href="/forums/">Developer Forums</a><a href="/documentation/">Documentation</a></nav>
        <li class="supplement details" data-supplement-id="details">
          <h2>Resources</h2>
          <ul class="links small">
            <li class="document"><a href="/documentation/translation">Translation Documentation</a></li>
            <li class="download">
              <ul class="options">
                <li><a href="https://devstreaming-cdn.apple.com/videos/wwdc/2025/10003/downloads/wwdc2025-10003_hd.mp4?dl=1">HD Video</a></li>
                <li><a href="https://devstreaming-cdn.apple.com/videos/wwdc/2025/10003/downloads/wwdc2025-10003_sd.mp4?dl=1">SD Video</a></li>
              </ul>
            </li>
          </ul>
        </li>
      </body>
      </html>
    `;

		http.get.mockResolvedValue(new Response(mockHtml));

		const result = await extractWWDCVideoContent(
			"https://developer.apple.com/videos/play/wwdc2025/10003/",
			"10003",
			"2025",
			[],
		);

		expect(result.resources.resourceLinks).toEqual([
			{
				title: "Translation Documentation",
				url: "https://developer.apple.com/documentation/translation",
			},
		]);
		expect(result.resources.hdVideo).toBe(
			"https://devstreaming-cdn.apple.com/videos/wwdc/2025/10003/downloads/wwdc2025-10003_hd.mp4?dl=1",
		);
		expect(result.resources.sdVideo).toBe(
			"https://devstreaming-cdn.apple.com/videos/wwdc/2025/10003/downloads/wwdc2025-10003_sd.mp4?dl=1",
		);
	});

	test("should extract related videos", async () => {
		const mockHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="video-title">
          <h1>Test Video</h1>
        </div>
        <div class="content">
          <a href="/videos/play/wwdc2025/10189/">Advanced Translation Features</a>
          <a href="/videos/play/wwdc2024/10055/">Introduction to Translation</a>
        </div>
      </body>
      </html>
    `;

		http.get.mockResolvedValue(new Response(mockHtml));

		const result = await extractWWDCVideoContent(
			"https://developer.apple.com/videos/play/wwdc2025/10004/",
			"10004",
			"2025",
			[],
		);

		expect(result.relatedVideos).toHaveLength(2);
		expect(result.relatedVideos?.[0]).toMatchObject({ id: "10189" });
		expect(result.relatedVideos?.[1]).toMatchObject({ id: "10055" });
	});

	test("should handle missing elements gracefully", async () => {
		const mockHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="video-title">
          <h1>Minimal Session</h1>
        </div>
      </body>
      </html>
    `;

		http.get.mockResolvedValue(new Response(mockHtml));

		const result = await extractWWDCVideoContent(
			"https://developer.apple.com/videos/play/wwdc2025/10005/",
			"10005",
			"2025",
			[],
		);

		expect(result).toMatchObject({
			id: "10005",
			title: "Minimal Session",
			hasTranscript: false,
			hasCode: false,
			topics: [],
			resources: {
				resourceLinks: [],
			},
			relatedVideos: undefined,
		});
	});

	test("should handle HTTP errors", async () => {
		http.get.mockRejectedValue(new Error("404 Not Found"));

		const error = await extractWWDCVideoContent(
			"https://developer.apple.com/videos/play/wwdc2025/99999/",
			"99999",
			"2025",
			[],
		).catch((error_: unknown) => error_);

		expect(String(error)).toContain("404 Not Found");
	});

	test("should extract speakers when available", async () => {
		const mockHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="video-title">
          <h1>Test Video</h1>
        </div>
        <div class="video-description">
          <p>Learn about new features with John Doe and Jane Smith. They will show you how to build amazing apps.</p>
        </div>
      </body>
      </html>
    `;

		http.get.mockResolvedValue(new Response(mockHtml));

		const result = await extractWWDCVideoContent(
			"https://developer.apple.com/videos/play/wwdc2025/10007/",
			"10007",
			"2025",
			[],
		);

		expect(result.speakers).toEqual(["John Doe", "Jane Smith"]);
	});
});
