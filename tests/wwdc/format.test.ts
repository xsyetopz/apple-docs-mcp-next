import { describe, expect, test } from "bun:test";
/**
 * The text helpers of the WWDC tool results
 */

import {
  capCodeLines,
  sessionLine,
  snippetAround,
  tidyCode,
} from "../../src/wwdc/format.ts";

describe("WWDC result helpers", () => {
  test("tidyCode removes leading blank lines and the title comment", () => {
    expect(tidyCode("\n  \n// Title\n\nlet a = 1", "Title")).toBe("let a = 1");
  });

  test("tidyCode keeps a first comment that differs from the title", () => {
    expect(tidyCode("// Other\nlet a = 1", "Title")).toBe(
      "// Other\nlet a = 1",
    );
  });

  test("capCodeLines ends a long snippet with a … line", () => {
    const code = Array.from({ length: 20 }, (_, i) => `line ${i}`).join("\n");
    const lines = capCodeLines(code).split("\n");

    expect(lines).toHaveLength(13);
    expect(lines.at(-1)).toBe("…");
    expect(lines[11]).toBe("line 11");
  });

  test("capCodeLines leaves a short snippet whole", () => {
    expect(capCodeLines("a\nb")).toBe("a\nb");
  });

  test("snippetAround keeps the match and about 300 chars", () => {
    const text = `${"a ".repeat(400)}needle${" b".repeat(400)}`;
    const snippet = snippetAround(text, "needle");

    expect(snippet).toContain("needle");
    expect(snippet.startsWith("…")).toBe(true);
    expect(snippet.endsWith("…")).toBe(true);
    expect(snippet.length).toBeLessThanOrEqual(302);
  });

  test("sessionLine shows the year, markers and topics only when asked", () => {
    const video = {
      title: "T",
      url: "https://x/1",
      year: "2025",
      hasTranscript: true,
      hasCode: false,
      topics: ["A", "B"],
    };

    expect(sessionLine(video, { showYear: true, showTopics: true })).toBe(
      "- [T](https://x/1) · 2025 · transcript · A, B",
    );
    expect(sessionLine(video, { showYear: false, showTopics: false })).toBe(
      "- [T](https://x/1) · transcript",
    );
  });
});
