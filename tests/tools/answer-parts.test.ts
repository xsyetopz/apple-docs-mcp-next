import { describe, expect, it } from "bun:test";

import { AppError } from "../../src/core/errors.ts";
import {
	answerPart,
	answerParts,
	PART_BYTES,
} from "../../src/tools/answer-parts.ts";

const sizes = (parts: readonly string[]): number[] =>
	parts.map((part) => Buffer.byteLength(part));

const fenceLines = (part: string): number =>
	part.split("\n").filter((line) => line.startsWith("```")).length;

const prose = Array.from(
	{ length: 2000 },
	(_, index) => `- Item ${index}: a line of an answer, long enough to add up`,
).join("\n");

describe("answerParts", () => {
	it("leaves an answer within the budget as it is", () => {
		const text = "x".repeat(PART_BYTES);

		expect(answerParts(text)).toEqual([text]);
	});

	it("cuts a longer answer at line ends, losing nothing", () => {
		const parts = answerParts(prose);

		expect(parts.length).toBeGreaterThan(1);
		expect(Math.max(...sizes(parts))).toBeLessThanOrEqual(PART_BYTES);
		expect(parts.join("\n")).toBe(prose);
	});

	it("closes a code block it cuts, and reopens it with the same language", () => {
		const code = Array.from(
			{ length: 1500 },
			(_, index) => `let value${index} = compute(${index})`,
		);
		const parts = answerParts(
			["# Code", "```swift", ...code, "```"].join("\n"),
		);

		expect(parts.length).toBeGreaterThan(1);
		expect(parts.map((part) => fenceLines(part) % 2)).toEqual(
			parts.map(() => 0),
		);
		expect(parts.slice(1).map((part) => part.split("\n")[0])).toEqual(
			parts.slice(1).map(() => "```swift"),
		);
		expect(parts.at(-1)?.endsWith("compute(1499)\n```")).toBe(true);
	});

	it("cuts one line longer than a part after a space", () => {
		const transcript = "word ".repeat(20_000).trim();
		const parts = answerParts(transcript);

		expect(Math.max(...sizes(parts))).toBeLessThanOrEqual(PART_BYTES);
		expect(parts.join("\n").replaceAll("\n", "")).toBe(transcript);
		expect(parts.map((part) => part.startsWith("word"))).toEqual(
			parts.map(() => true),
		);
	});

	it("keeps each character whole in text without spaces, whatever its width in bytes", () => {
		const text = "視聴🎬".repeat(8000);
		const parts = answerParts(text);

		expect(Math.max(...sizes(parts))).toBeLessThanOrEqual(PART_BYTES);
		expect(parts.join("\n").replaceAll("\n", "")).toBe(text);
	});
});

describe("answerPart", () => {
	it("adds no note to an answer in one part", () => {
		expect(answerPart("a_tool", "short", 1)).toBe("short");
	});

	it("says which part this is and how to get the next, within the budget", () => {
		const count = answerParts(prose).length;
		const first = answerPart("a_tool", prose, 1);
		const last = answerPart("a_tool", prose, count);

		expect(first).toEndWith(
			`\n\n---\nPart 1 of ${count}. For the next part, call a_tool again with the same arguments and part: 2.`,
		);
		expect(last).toEndWith(
			`\n\n---\nPart ${count} of ${count}. This is the last part.`,
		);
		expect(Buffer.byteLength(first)).toBeLessThanOrEqual(PART_BYTES);
	});

	it("refuses a part past the end, naming how many there are", () => {
		const count = answerParts(prose).length;
		const refuse = (): string => answerPart("a_tool", prose, count + 1);

		expect(refuse).toThrow(AppError);
		expect(refuse).toThrow(
			`This answer has ${count} part(s); there is no part ${count + 1}`,
		);
	});
});
