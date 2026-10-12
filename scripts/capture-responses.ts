/**
 * Captures complete responses of the endpoints Swift-DocC's specs do not cover, requested the way the tools request
 * them, for quicktype to type (`npm run types:captured`): Apple's search API (each stream as received, its messages as
 * one JSON array, and the document they build) and the technologies page.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { APPLE_URLS } from "../src/core/constants.ts";
import { httpClient } from "../src/core/http-client.ts";
import { type SearchType, searchStreams } from "../src/docs/search-api.ts";
import { streamedDocument } from "../src/docs/search-parser.ts";

/** One search per kind of result: docs and WWDC sessions, guidelines, sample code, API reference, App Store Connect Help */
const SEARCHES: Array<[name: string, query: string, type: SearchType]> = [
  ["navigationstack-all", "NavigationStack", "all"],
  ["tab-bars-design", "tab bars", "design"],
  ["food-truck-sample", "Food Truck", "sample"],
  ["urlsession-documentation", "URLSession", "documentation"],
  ["promotional-text-help", "promotional text", "help"],
];
const OUT = "api-map/responses";

await mkdir(OUT, { recursive: true });
for (const [name, query, type] of SEARCHES) {
  const streams = await searchStreams(query, type);
  for (const [index, stream] of streams.entries()) {
    const file = `${OUT}/${name}-${index + 1}`;
    await writeFile(`${file}.jsonl`, stream);
    await writeFile(
      `${file}.messages.json`,
      JSON.stringify(
        stream
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line) as unknown),
      ),
    );
    await writeFile(`${file}.document.json`, streamedDocument(stream));
  }
}
await writeFile(
  `${OUT}/technologies.json`,
  await (await httpClient.get(APPLE_URLS.TECHNOLOGIES_JSON)).text(),
);
