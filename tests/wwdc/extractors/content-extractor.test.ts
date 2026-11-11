/**
 * Tests for WWDC content extractor
 */
import { beforeEach, describe, expect, test } from "bun:test";

import { extractVideoContent as extractWWDCVideoContent } from "../../../src/wwdc/extractors/content-extractor.ts";
import { spyOnHttpClient } from "../../mocks/http-client.mock.ts";

describe("WWDC Content Extractor", () => {
	let http: ReturnType<typeof spyOnHttpClient>;

	beforeEach(() => {
		http = spyOnHttpClient();
	});

	test("should extract video metadata correctly", async () => {
		const mockHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Meet the Translation API - WWDC25 - Videos - Apple Developer</title>
        <meta property="og:description" content="Discover how you can translate text across different languages in your app" />
      </head>
      <body>
        <div class="video-title">
          <h1>Meet the Translation API</h1>
        </div>
        <ul class="inline-items">
          <li class="video-duration">15 min</li>
          <li>WWDC 2025</li>
        </ul>
        <div class="video-description">
          <p>Discover how you can translate text across different languages in your app using the new Translation API.</p>
        </div>
        <section class="topics">
          <h3>Topics</h3>
          <ul>
            <li><a href="/videos/topics/machine-learning-ai">Machine Learning & AI</a></li>
            <li><a href="/videos/topics/localization">Localization</a></li>
          </ul>
        </section>
      </body>
      </html>
    `;

		http.get.mockResolvedValue(new Response(mockHtml));

		const videoUrl = "https://developer.apple.com/videos/play/wwdc2025/10188/";
		const result = await extractWWDCVideoContent(videoUrl, "10188", "2025", [
			"Machine Learning & AI",
		]);

		expect(result).toMatchObject({
			id: "10188",
			url: "https://developer.apple.com/videos/play/wwdc2025/10188/",
			title: "Meet the Translation API",
			duration: "15 min",
			year: "2025",
			topics: ["Machine Learning & AI"],
		});
	});

	test("should extract transcript when available", async () => {
		const mockHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="video-title">
          <h1>Test Video</h1>
        </div>
        <div id="transcript" class="transcript">
          <p data-timestamp="00:00">Welcome to WWDC</p>
          <p data-timestamp="00:30">Today we will discuss...</p>
        </div>
      </body>
      </html>
    `;

		http.get.mockResolvedValue(new Response(mockHtml));

		const result = await extractWWDCVideoContent(
			"https://developer.apple.com/videos/play/wwdc2025/10001/",
			"10001",
			"2025",
			[],
		);

		expect(result.hasTranscript).toBe(true);
		expect(result.transcript?.segments).toEqual([
			{ timestamp: "00:00", text: "Welcome to WWDC" },
			{ timestamp: "00:30", text: "Today we will discuss..." },
		]);
		expect(result.transcript?.fullText).toContain("Welcome to WWDC");
	});

	test("should extract code examples", async () => {
		const mockHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="video-title">
          <h1>SwiftUI Animations</h1>
        </div>
        <li class="supplement sample-code" data-supplement-id="sample-code">
          <ul class="no-bullet">
            <li class="sample-code-main-container">
              <p>2:10 - <a class="jump-to-time-sample" href="/videos/play/wwdc2025/10002/?time=130">Spring a circle</a></p>
              <pre class="code-source"><code>
struct ContentView: View {
    @State private var isAnimating = false

    var body: some View {
        Circle()
            .scaleEffect(isAnimating ? 1.5 : 1.0)
            .animation(.spring(), value: isAnimating)
    }
}
</code></pre>
            </li>
          </ul>
        </li>
      </body>
      </html>
    `;

		http.get.mockResolvedValue(new Response(mockHtml));

		const result = await extractWWDCVideoContent(
			"https://developer.apple.com/videos/play/wwdc2025/10002/",
			"10002",
			"2025",
			[],
		);

		expect(result.hasCode).toBe(true);
		expect(result.codeExamples).toHaveLength(1);
		expect(result.codeExamples?.[0]).toMatchObject({
			timestamp: "2:10",
			title: "Spring a circle",
			language: "swift",
		});
		expect(result.codeExamples?.[0]?.code).toContain("struct ContentView");
	});

	test("should clean and format code examples", async () => {
		const mockHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="video-title">
          <h1>Code Formatting Test</h1>
        </div>
        <li class="sample-code-main-container">
          <p>0:42 - Example</p>
          <pre class="code-source" data-language="swift">
          <code>
            // This is a comment
            func example() {
                print("Hello")
            }
          </code>
          </pre>
        </li>
      </body>
      </html>
    `;

		http.get.mockResolvedValue(new Response(mockHtml));

		const result = await extractWWDCVideoContent(
			"https://developer.apple.com/videos/play/wwdc2025/10006/",
			"10006",
			"2025",
			[],
		);

		expect(result.codeExamples?.[0]?.code).toBe(
			'// This is a comment\nfunc example() {\n    print("Hello")\n}',
		);
	});
});
