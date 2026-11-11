import type { CodeExample } from "../types.ts";
import { firstNonEmpty } from "./dom.ts";

/** A session's code section whose examples no longer hold code where the extractor reads it */
class CodeSectionChangedError extends Error {}

const detectLanguage = (element: HTMLElement): string => {
	const { className } = element;
	if (className.includes("swift")) {
		return "swift";
	}
	if (className.includes("objc") || className.includes("objective-c")) {
		return "objc";
	}
	if (className.includes("javascript") || className.includes("js")) {
		return "javascript";
	}

	const dataLang = firstNonEmpty(
		element.dataset["language"],
		element.dataset["lang"],
	);
	return dataLang === "" ? "swift" : dataLang.toLowerCase();
};

const cleanCodeIndentation = (code: string): string => {
	const lines = code.split("\n");

	while (lines.length > 0 && lines[0]?.trim() === "") {
		lines.shift();
	}
	while (lines.length > 0 && lines.at(-1)?.trim() === "") {
		lines.pop();
	}

	const minIndent = Math.min(
		...lines
			.filter((line) => line.trim().length > 0)
			.map((line) => /^(\s*)/u.exec(line)?.[1]?.length ?? 0),
	);

	return lines
		.map((line) => line.slice(minIndent))
		.join("\n")
		.trim();
};

const isSet = (value: string | undefined): boolean =>
	value !== undefined && value !== "";

const removeDuplicateCodeExamples = (
	examples: CodeExample[],
): CodeExample[] => {
	const seen = new Map<string, CodeExample>();

	for (const example of examples) {
		const key = example.code.trim();
		const existing = seen.get(key);
		if (
			!existing ||
			(isSet(example.title) && !isSet(existing.title)) ||
			(isSet(example.timestamp) && !isSet(existing.timestamp))
		) {
			seen.set(key, example);
		}
	}

	return [...seen.values()];
};

/**
 * The code examples in the session page's code section: one container each, its "m:ss - Title" line before the code
 */
export const extractCodeExamples = (
	document: Document,
	videoUrl: string,
): CodeExample[] => {
	const containers = document.querySelectorAll("li.sample-code-main-container");
	const codeBlocks = [
		...document.querySelectorAll<HTMLElement>(
			"li.sample-code-main-container pre.code-source",
		),
	];
	if (codeBlocks.length !== containers.length) {
		throw new CodeSectionChangedError(
			`${videoUrl}: ${containers.length} code examples, ${codeBlocks.length} with code`,
		);
	}

	const examples = codeBlocks.map((block): CodeExample => {
		const code = cleanCodeIndentation(
			(block.querySelector("code") ?? block).textContent ?? "",
		);
		const heading = block.previousElementSibling?.textContent?.trim() ?? "";
		const match = /^(\d+:\d+)\s*-\s*(.+)$/u.exec(heading);
		return {
			timestamp: match?.[1] ?? "",
			title: match?.[2]?.trim() ?? heading,
			language: detectLanguage(block),
			code,
		};
	});

	return removeDuplicateCodeExamples(
		examples.filter((example) => example.code.length >= 10),
	);
};

/**
 * Extract code from transcript (legacy pages)
 */
export const extractCodeFromTranscript = (
	document: Document,
): CodeExample[] => {
	const examples: CodeExample[] = [];

	for (const block of document.querySelectorAll<HTMLElement>(
		".transcript pre code, .transcript .code-voice",
	)) {
		const code = cleanCodeIndentation(block.textContent ?? "");
		if (code.length > 20) {
			examples.push({ language: detectLanguage(block), code });
		}
	}

	return examples;
};
