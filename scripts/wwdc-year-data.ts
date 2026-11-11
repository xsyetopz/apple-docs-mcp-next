import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import type {
	GlobalMetadata,
	TopicIndex,
	WWDCVideo,
	YearIndex,
} from "../src/wwdc/types.ts";

type Entry = YearIndex["videos"][number];

const DATA = path.resolve("data/wwdc");

const isObject = (value: unknown): boolean =>
	typeof value === "object" && value !== null;

const metaSchema = z.custom<GlobalMetadata>(isObject);
const yearIndexSchema = z.custom<YearIndex>(isObject);
const allVideosSchema = z.custom<{ videos: Entry[] }>(isObject);
const topicIndexSchema = z.custom<TopicIndex>(isObject);

const readJSON = async <T>(file: string, schema: z.ZodType<T>): Promise<T> =>
	schema.parse(JSON.parse(await readFile(path.join(DATA, file), "utf8")));

/**
 * Writes a JSON file under data/wwdc/, creating its folder
 */
export const writeJSON = async (
	file: string,
	value: unknown,
): Promise<void> => {
	await mkdir(path.dirname(path.join(DATA, file)), { recursive: true });
	await writeFile(path.join(DATA, file), `${JSON.stringify(value, null, 2)}\n`);
};

/**
 * Runs `run` on each item one after the other, so a script paces its requests to Apple's servers
 */
export const sequentially = <T, R>(
	items: T[],
	run: (item: T) => Promise<R>,
): Promise<R[]> =>
	Array.fromAsync(
		(async function* () {
			for (const item of items) {
				yield run(item);
			}
		})(),
	);

/**
 * The bundled data's index.json
 */
export const readMeta = (): Promise<GlobalMetadata> =>
	readJSON("index.json", metaSchema);

/**
 * The index entry of a session
 */
export const entryOf = (video: WWDCVideo): Entry => ({
	id: video.id,
	year: video.year,
	title: video.title,
	topics: video.topics,
	duration: video.duration,
	hasCode: video.hasCode,
	hasTranscript: video.hasTranscript,
	url: video.url,
	dataFile: `videos/${video.year}-${video.id}.json`,
});

/** The order of every topic's sessions: the tools list a topic's first sessions */
const newestFirst = (a: Entry, b: Entry): number =>
	b.year.localeCompare(a.year) || a.title.localeCompare(b.title);

/**
 * The year's stored entries whose ids are not in `listed`: sessions Apple no longer lists
 */
export const retiredEntries = async (
	year: string,
	listed: Set<string>,
): Promise<Entry[]> => {
	const file = `by-year/${year}/index.json`;
	if (!(await Bun.file(path.join(DATA, file)).exists())) {
		return [];
	}
	const { videos } = await readJSON(file, yearIndexSchema);
	return videos.filter((entry) => !listed.has(entry.id));
};

/**
 * Writes by-year/<year>/index.json
 */
export const writeYearIndex = (
	year: string,
	entries: Entry[],
): Promise<void> => {
	const yearIndex: YearIndex = {
		year,
		videoCount: entries.length,
		topics: [...new Set(entries.flatMap((entry) => entry.topics))].toSorted(),
		videos: entries,
	};
	return writeJSON(`by-year/${year}/index.json`, yearIndex);
};

/**
 * Replaces the year's entries in all-videos.json and returns the new list
 */
export const updateAllVideos = async (
	year: string,
	entries: Entry[],
): Promise<Entry[]> => {
	const all = await readJSON("all-videos.json", allVideosSchema);
	const everything = [
		...all.videos.filter((video) => video.year !== year),
		...entries,
	];
	await writeJSON("all-videos.json", { videos: everything });
	return everything;
};

/**
 * Replaces the year's sessions in every topic's index; returns each topic's session count
 */
export const updateTopicIndexes = async (
	meta: GlobalMetadata,
	year: string,
	entries: Entry[],
): Promise<Record<string, number>> => {
	const counts = await sequentially(meta.topics, async (topic) => {
		const index = await readJSON(
			`by-topic/${topic.id}/index.json`,
			topicIndexSchema,
		);
		const videosOfTopic = [
			...index.videos.filter((video) => video.year !== year),
			...entries.filter((entry) => entry.topics.includes(topic.name)),
		].toSorted((a, b) => newestFirst(a, b));
		const updated: TopicIndex = {
			...index,
			videoCount: videosOfTopic.length,
			years: [...new Set(videosOfTopic.map((video) => video.year))],
			videos: videosOfTopic,
		};
		await writeJSON(`by-topic/${topic.id}/index.json`, updated);
		return [topic.id, videosOfTopic.length] as const;
	});
	return Object.fromEntries(counts);
};

/**
 * Puts the year in index.json
 */
export const writeMeta = (
	meta: GlobalMetadata,
	year: string,
	entries: Entry[],
	everything: Entry[],
	byTopic: Record<string, number>,
): Promise<void> => {
	const updatedMeta: GlobalMetadata = {
		...meta,
		lastUpdated: new Date().toISOString(),
		totalVideos: everything.length,
		years: [...new Set([...meta.years, year])].toSorted().toReversed(),
		statistics: {
			...meta.statistics,
			byTopic,
			byYear: { ...meta.statistics.byYear, [year]: entries.length },
			videosWithCode: everything.filter((video) => video.hasCode).length,
			videosWithTranscript: everything.filter((video) => video.hasTranscript)
				.length,
		},
	};
	return writeJSON("index.json", updatedMeta);
};
