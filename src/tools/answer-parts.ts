/** Cuts a tool's answer into parts that each stay under 10,000 tokens, so no client truncates or refuses one. */
import { AppError, ErrorType } from "../core/errors.ts";

/**
 * The UTF-8 bytes one part may hold. The densest of 38 recorded answers held 3.0 bytes per token under the Claude 2
 * and o200k tokenizers, and Anthropic's token-counting guide gives its newer tokenizer about 30% more tokens for the
 * same text, which leaves 2.3 bytes per token: 10,000 tokens hold at least 23,000 bytes.
 */
export const PART_BYTES = 22_000;

/** Room kept in each part for the note that names the next part, and for closing a code block cut in two */
const BODY_BYTES = PART_BYTES - 400;

/** At most 5,000 characters, which UTF-8 writes in at most 20,000 bytes, cut after whitespace where there is any */
const PIECE = /.{1,5000}(?:\s|$)|.{1,5000}/gsu;

const FENCE = "```";

const bytes = (text: string): number => Buffer.byteLength(text);

const pieces = (line: string): string[] =>
	bytes(line) > BODY_BYTES
		? Array.from(line.matchAll(PIECE), ([piece]) => piece)
		: [line];

/** The answer's parts in order, cut at line ends; a code block cut in two is closed in one part and reopened in the next */
export const answerParts = (text: string): string[] => {
	if (bytes(text) <= PART_BYTES) {
		return [text];
	}
	const parts: string[] = [];
	let lines: string[] = [];
	let size = 0;
	let fence: string | undefined;
	for (const line of text.split("\n").flatMap((whole) => pieces(whole))) {
		const isFence = line.trimStart().startsWith(FENCE);
		const closesFence = isFence && fence !== undefined;
		if (size + bytes(line) + 1 > BODY_BYTES && !closesFence) {
			parts.push(
				[...lines, ...(fence === undefined ? [] : [FENCE])].join("\n"),
			);
			lines = fence === undefined ? [] : [fence];
			size = bytes(fence ?? "");
		}
		lines.push(line);
		size += bytes(line) + 1;
		if (isFence) {
			fence = closesFence ? undefined : line;
		}
	}
	parts.push(lines.join("\n"));
	return parts;
};

/** One part of an answer and, when the answer has more than one, a note on which part it is and how to get the next */
export const answerPart = (
	tool: string,
	text: string,
	number: number,
): string => {
	const parts = answerParts(text);
	const part = parts[number - 1];
	if (part === undefined) {
		throw new AppError({
			type: ErrorType.INVALID_INPUT,
			message: `This answer has ${parts.length} part(s); there is no part ${number}`,
			suggestions: [
				`Call ${tool} with the same arguments and a part from 1 to ${parts.length}`,
			],
		});
	}
	if (parts.length === 1) {
		return part;
	}
	const next =
		number < parts.length
			? `For the next part, call ${tool} again with the same arguments and part: ${number + 1}.`
			: "This is the last part.";
	return `${part}\n\n---\nPart ${number} of ${parts.length}. ${next}`;
};
