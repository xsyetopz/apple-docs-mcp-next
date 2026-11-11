/**
 * Captures complete responses of the endpoints Swift-DocC's specs do not cover, requested the way the tools request
 * them, for quicktype to type (`bun run types:captured`): Apple's search API (each stream as received, its messages as
 * one JSON array, and the document they build) and the technologies page.
 */
import { mkdir, writeFile } from "node:fs/promises";

import { APPLE_URLS } from "../src/core/constants.ts";
import { httpClient } from "../src/core/http-client.ts";
import { searchStreams, type SearchType } from "../src/docs/search-api.ts";
import { streamedDocument } from "../src/docs/search-parser.ts";
import { inOrder } from "./in-order.ts";

/** One search per kind of result: docs and WWDC sessions, guidelines, sample code, API reference, App Store Connect Help */
const SEARCHES: [name: string, query: string, type: SearchType][] = [
	["navigationstack-all", "NavigationStack", "all"],
	["tab-bars-design", "tab bars", "design"],
	["food-truck-sample", "Food Truck", "sample"],
	["urlsession-documentation", "URLSession", "documentation"],
	["promotional-text-help", "promotional text", "help"],
];
const OUT = "api-map/responses";

const parseMessage = (line: string): unknown => JSON.parse(line);

const writeStream = async (
	name: string,
	index: number,
	stream: string,
): Promise<void> => {
	const file = `${OUT}/${name}-${index + 1}`;
	await writeFile(`${file}.jsonl`, stream);
	await writeFile(
		`${file}.messages.json`,
		JSON.stringify(
			stream
				.trim()
				.split("\n")
				.map((line) => parseMessage(line)),
		),
	);
	await writeFile(`${file}.document.json`, streamedDocument(stream));
};

const capture = async ([name, query, type]: (typeof SEARCHES)[number]) => {
	const streams = await searchStreams(query, type);
	await Promise.all(
		streams.map((stream, index) => writeStream(name, index, stream)),
	);
};

await mkdir(OUT, { recursive: true });
await inOrder(SEARCHES, capture);
const technologies = await httpClient.get(APPLE_URLS.TECHNOLOGIES_JSON);
await writeFile(`${OUT}/technologies.json`, await technologies.text());
