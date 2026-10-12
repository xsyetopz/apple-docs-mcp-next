/**
 * Adds one WWDC year to the bundled data in data/wwdc/, or replaces it when run again: the year's video list from
 * developer.apple.com/videos/wwdc<year>/, each session's topics from Apple's topic pages (each topic's `url` in
 * index.json), then each session's page. Writes videos/<year>-<id>.json and by-year/<year>/index.json, and puts the
 * year in index.json, all-videos.json and every topic's index, whose sessions run newest year first, then by title. A
 * stored session Apple no longer lists (its page redirects) keeps its stored data.
 *
 *   bun scripts/add-wwdc-year.ts 2026
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { extractVideoContent } from "../src/wwdc/extractors/content-extractor.ts";
import { extractTopicVideos } from "../src/wwdc/extractors/topics-extractor.ts";
import { extractVideoList } from "../src/wwdc/extractors/video-list-extractor.ts";
import type {
  GlobalMetadata,
  TopicIndex,
  WWDCVideo,
  YearIndex,
} from "../src/wwdc/types.ts";

type Entry = YearIndex["videos"][number];

class UsageError extends Error {}
class EmptyYearError extends Error {}
class UntopicedYearError extends Error {}

const DATA = path.resolve("data/wwdc");

async function readJSON<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(DATA, file), "utf8")) as T;
}

async function writeJSON(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(path.join(DATA, file)), { recursive: true });
  await writeFile(path.join(DATA, file), `${JSON.stringify(value, null, 2)}\n`);
}

function entryOf(video: WWDCVideo): Entry {
  return {
    id: video.id,
    year: video.year,
    title: video.title,
    topics: video.topics,
    duration: video.duration,
    hasCode: video.hasCode,
    hasTranscript: video.hasTranscript,
    url: video.url,
    dataFile: `videos/${video.year}-${video.id}.json`,
  };
}

/** The order of every topic's sessions: the tools list a topic's first sessions */
function newestFirst(a: Entry, b: Entry): number {
  return b.year.localeCompare(a.year) || a.title.localeCompare(b.title);
}

/** Each of the year's sessions with the names of the topics whose pages list it */
async function topicsOfYear(
  year: string,
  topics: GlobalMetadata["topics"],
): Promise<Map<string, string[]>> {
  const listed: Array<[string, string]> = [];
  for (const topic of topics) {
    const ids = new Set(
      (await extractTopicVideos(topic.url))
        .filter((video) => video.year === year)
        .map((video) => video.id),
    );
    listed.push(...[...ids].map((id): [string, string] => [id, topic.name]));
  }
  if (listed.length === 0) {
    throw new UntopicedYearError(
      `no topic page lists a WWDC${year} session: check extractTopicVideos against the pages`,
    );
  }
  return listed.reduce(
    (map, [id, name]) => map.set(id, [...(map.get(id) ?? []), name]),
    new Map<string, string[]>(),
  );
}

async function addYear(year: string): Promise<void> {
  const meta = await readJSON<GlobalMetadata>("index.json");
  const list = await extractVideoList(year);
  if (list.length === 0) {
    throw new EmptyYearError(
      `no sessions found for WWDC${year}: check extractVideoList against the page`,
    );
  }
  const topicsOf = await topicsOfYear(year, meta.topics);
  const videos: WWDCVideo[] = [];
  for (const item of list) {
    const video = await extractVideoContent(
      item.url,
      item.id,
      year,
      topicsOf.get(item.id) ?? [],
    );
    await writeJSON(`videos/${year}-${item.id}.json`, video);
    videos.push(video);
  }
  const listed = new Set(list.map((item) => item.id));
  const stored = existsSync(path.join(DATA, `by-year/${year}/index.json`))
    ? (await readJSON<YearIndex>(`by-year/${year}/index.json`)).videos
    : [];
  const retired = stored.filter((entry) => !listed.has(entry.id));
  const entries = [...videos.map(entryOf), ...retired].sort((a, b) =>
    a.title.localeCompare(b.title),
  );
  const topics = [...new Set(entries.flatMap((entry) => entry.topics))].sort();
  const yearIndex: YearIndex = {
    year,
    videoCount: entries.length,
    topics,
    videos: entries,
  };
  await writeJSON(`by-year/${year}/index.json`, yearIndex);

  const all = await readJSON<{ videos: Entry[] }>("all-videos.json");
  const everything = [
    ...all.videos.filter((video) => video.year !== year),
    ...entries,
  ];
  await writeJSON("all-videos.json", { videos: everything });

  const byTopic: Record<string, number> = {};
  for (const topic of meta.topics) {
    const index = await readJSON<TopicIndex>(`by-topic/${topic.id}/index.json`);
    const videosOfTopic = [
      ...index.videos.filter((video) => video.year !== year),
      ...entries.filter((entry) => entry.topics.includes(topic.name)),
    ].sort(newestFirst);
    const updated: TopicIndex = {
      ...index,
      videoCount: videosOfTopic.length,
      years: [...new Set(videosOfTopic.map((video) => video.year))],
      videos: videosOfTopic,
    };
    await writeJSON(`by-topic/${topic.id}/index.json`, updated);
    byTopic[topic.id] = videosOfTopic.length;
  }

  const updatedMeta: GlobalMetadata = {
    ...meta,
    lastUpdated: new Date().toISOString(),
    totalVideos: everything.length,
    years: [...new Set([...meta.years, year])].sort().reverse(),
    statistics: {
      ...meta.statistics,
      byTopic,
      byYear: { ...meta.statistics.byYear, [year]: entries.length },
      videosWithCode: everything.filter((video) => video.hasCode).length,
      videosWithTranscript: everything.filter((video) => video.hasTranscript)
        .length,
    },
  };
  await writeJSON("index.json", updatedMeta);
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
}

const year = process.argv[2];
if (!year || !/^\d{4}$/.test(year)) {
  throw new UsageError("usage: bun scripts/add-wwdc-year.ts <year>");
}
await addYear(year);
