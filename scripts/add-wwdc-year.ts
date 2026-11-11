/**
 * Adds one WWDC year to the bundled data in data/wwdc/, or replaces it when run again: the year's video list from
 * developer.apple.com/videos/wwdc<year>/, each session's topics from Apple's topic pages (each topic's `url` in
 * index.json), then each session's page. Writes videos/<year>-<id>.json and by-year/<year>/index.json, and puts the
 * year in index.json, all-videos.json and every topic's index, whose sessions run newest year first, then by title. A
 * stored session Apple no longer lists (its page redirects) keeps its stored data.
 *
 *   bun scripts/add-wwdc-year.ts 2026
 */
import { extractVideoContent } from "../src/wwdc/extractors/content-extractor.ts";
import { extractTopicVideos } from "../src/wwdc/extractors/topics-extractor.ts";
import { extractVideoList } from "../src/wwdc/extractors/video-list-extractor.ts";
import type { GlobalMetadata } from "../src/wwdc/types.ts";
import {
	entryOf,
	readMeta,
	retiredEntries,
	sequentially,
	updateAllVideos,
	updateTopicIndexes,
	writeJSON,
	writeMeta,
	writeYearIndex,
} from "./wwdc-year-data.ts";

/** Each of the year's sessions with the names of the topics whose pages list it */
const topicsOfYear = async (
	year: string,
	topics: GlobalMetadata["topics"],
): Promise<Map<string, string[]>> => {
	const perTopic = await sequentially(topics, async (topic) => {
		const videos = await extractTopicVideos(topic.url);
		const ids = new Set(
			videos.filter((video) => video.year === year).map((video) => video.id),
		);
		return [...ids].map((id): [string, string] => [id, topic.name]);
	});
	const listed = perTopic.flat();
	if (listed.length === 0) {
		throw new Error(
			`no topic page lists a WWDC${year} session: check extractTopicVideos against the pages`,
		);
	}
	const topicsOf = new Map<string, string[]>();
	for (const [id, name] of listed) {
		topicsOf.set(id, [...(topicsOf.get(id) ?? []), name]);
	}
	return topicsOf;
};

const addYear = async (year: string): Promise<void> => {
	const meta = await readMeta();
	const list = await extractVideoList(year);
	if (list.length === 0) {
		throw new Error(
			`no sessions found for WWDC${year}: check extractVideoList against the page`,
		);
	}
	const topicsOf = await topicsOfYear(year, meta.topics);
	const videos = await sequentially(list, async (item) => {
		const video = await extractVideoContent(
			item.url,
			item.id,
			year,
			topicsOf.get(item.id) ?? [],
		);
		await writeJSON(`videos/${year}-${item.id}.json`, video);
		return video;
	});
	const retired = await retiredEntries(
		year,
		new Set(list.map((item) => item.id)),
	);
	const entries = [
		...videos.map((video) => entryOf(video)),
		...retired,
	].toSorted((a, b) => a.title.localeCompare(b.title));
	await writeYearIndex(year, entries);
	const everything = await updateAllVideos(year, entries);
	const byTopic = await updateTopicIndexes(meta, year, entries);
	await writeMeta(meta, year, entries, everything, byTopic);
	console.log(
		JSON.stringify({
			event: "wwdc_year_added",
			year,
			videos: entries.length,
			withCode: entries.filter((entry) => entry.hasCode).length,
			withoutTopic: entries
				.filter((entry) => entry.topics.length === 0)
				.map((entry) => entry.id),
			retired: retired.map((entry) => entry.id),
		}),
	);
};

const year = process.argv[2];
if (year === undefined || !/^\d{4}$/u.test(year)) {
	throw new Error("usage: bun scripts/add-wwdc-year.ts <year>");
}
await addYear(year);
