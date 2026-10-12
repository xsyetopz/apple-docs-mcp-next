/**
 * Lists every page of Apple's documentation with its title, URL, kind and place in the tree, from the files the
 * website's sidebar reads: technologies.json, then each technology's navigator index (index/<name>). The Human
 * Interface Guidelines have no index, so their pages come from each page's Topics. One request a second.
 *
 *   bun scripts/build-docs-map.ts api-map/apple-docs-map.tsv
 */
import { writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { APPLE_URLS } from "../src/core/constants.ts";
import { httpClient } from "../src/core/http-client.ts";
import { helpPagesOf } from "../src/docs/help-pages.ts";
import type {
  RenderIndex,
  RenderIndexNode,
  RenderNode,
} from "../src/types/docc.ts";
import { isTopicReference } from "../src/types/docc.ts";

class UsageError extends Error {}

/** One page; `home` is its technology's own path, which decides who keeps a page several technologies list */
interface Row {
  url: string;
  title: string;
  kind: string;
  technology: string;
  group: string;
  tree: string;
  home: string;
}

const SITE = "https://developer.apple.com";
const HIG = {
  title: "Human Interface Guidelines",
  path: "/design/human-interface-guidelines",
};
const HELP = {
  title: "App Store Connect Help",
  path: "/help/app-store-connect",
};
const PACE_MS = 1000;

/** Every page under `nodes`, with the section heading above it and the titles of its ancestors */
const rowsOf = (
  nodes: RenderIndexNode[],
  technology: { title: string; url: string },
  ancestors: string[],
): Row[] => {
  let group = "";
  return nodes.flatMap((node) => {
    if (node.type === "groupMarker") {
      group = node.title;
      return [];
    }
    const own = node.path
      ? [
          {
            url: SITE + node.path,
            title: node.title,
            kind: node.type ?? "",
            technology: technology.title,
            group,
            tree: ancestors.join(" › "),
            home: technology.url,
          },
        ]
      : [];
    return [
      ...own,
      ...rowsOf(node.children ?? [], technology, [...ancestors, node.title]),
    ];
  });
};

/** The HIG's pages, breadth-first from its root through each page's Topics */
const higRows = async (): Promise<Row[]> => {
  const rows: Row[] = [];
  const seen = new Set([HIG.path]);
  const queue = [{ path: HIG.path, ancestors: [] as string[] }];
  for (let next = queue.shift(); next; next = queue.shift()) {
    const page = await httpClient.getJson<RenderNode>(
      `${APPLE_URLS.TUTORIALS_DATA}${next.path.slice(1)}.json`,
    );
    await sleep(PACE_MS);
    const ancestors = [...next.ancestors, page.metadata?.title ?? next.path];
    for (const section of page.topicSections ?? []) {
      for (const identifier of section.identifiers) {
        const ref = page.references?.[identifier];
        if (
          !isTopicReference(ref) ||
          !ref.url.startsWith(HIG.path) ||
          seen.has(ref.url)
        ) {
          continue;
        }
        seen.add(ref.url);
        rows.push({
          url: SITE + ref.url,
          title: ref.title,
          kind: ref.role ?? ref.kind,
          technology: HIG.title,
          group: section.title ?? "",
          tree: ancestors.join(" › "),
          home: HIG.path,
        });
        queue.push({ path: ref.url, ancestors });
      }
    }
  }
  return rows;
};

/** App Store Connect Help's pages, from the navigation every help page carries */
const helpRows = async (): Promise<Row[]> => {
  const html = await httpClient.getText(APPLE_URLS.APP_STORE_CONNECT_HELP);
  return helpPagesOf(html, APPLE_URLS.APP_STORE_CONNECT_HELP).map(
    ({ url, title, section }) => ({
      url,
      title,
      kind: "article",
      technology: HELP.title,
      group: section,
      tree: `${HELP.title} › ${section}`,
      home: HELP.path,
    }),
  );
};

/** One row per URL: the first, unless a later one comes from the technology the URL belongs to */
const byUrl = (rows: Row[]): Row[] => {
  const owns = (row: Row): boolean =>
    row.url === SITE + row.home || row.url.startsWith(`${SITE}${row.home}/`);
  const kept = new Map<string, Row>();
  for (const row of rows) {
    const current = kept.get(row.url);
    if (!current || (!owns(current) && owns(row))) {
      kept.set(row.url, row);
    }
  }
  return [...kept.values()];
};

const buildMap = async (out: string): Promise<void> => {
  const catalog = await httpClient.getJson<RenderNode>(
    APPLE_URLS.TECHNOLOGIES_JSON,
  );
  const technologies = Object.values(catalog.references ?? {})
    .filter(isTopicReference)
    .filter(
      (ref) =>
        ref.role === "collection" && ref.url.startsWith("/documentation/"),
    );
  const rows: Row[] = [];
  const failed: Array<{ technology: string; error: string }> = [];
  for (const [n, technology] of technologies.entries()) {
    const name = technology.url.split("/").pop() ?? "";
    try {
      const index = await httpClient.getJson<RenderIndex>(
        `${APPLE_URLS.TUTORIALS_DATA}index/${name}`,
      );
      const languages = index.interfaceLanguages ?? {};
      // Web-service references (App Store Connect API) index their pages under `data`
      rows.push(
        ...rowsOf(
          [languages["swift"], languages["occ"], languages["data"]].find(
            (nodes) => nodes?.length,
          ) ?? [],
          technology,
          [],
        ),
      );
    } catch (error) {
      failed.push({
        technology: name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    if ((n + 1) % 25 === 0) {
      console.log(
        JSON.stringify({
          event: "progress",
          technologies: n + 1,
          of: technologies.length,
          rows: rows.length,
        }),
      );
    }
    await sleep(PACE_MS);
  }
  rows.push(...(await higRows()));
  rows.push(...(await helpRows()));
  const pages = byUrl(rows);
  const clean = (text: string): string => text.replace(/[\t\r\n]+/g, " ");
  const lines = pages.map((row) =>
    [row.url, row.title, row.kind, row.technology, row.group, row.tree]
      .map(clean)
      .join("\t"),
  );
  await writeFile(
    out,
    `${["url\ttitle\tkind\ttechnology\tgroup\ttree", ...lines].join("\n")}\n`,
  );
  console.log(
    JSON.stringify({
      event: "docs_map_built",
      out,
      pages: pages.length,
      rows: rows.length,
      technologies: technologies.length,
      failed,
    }),
  );
};

const out = process.argv[2];
if (!out) {
  throw new UsageError("usage: bun scripts/build-docs-map.ts <out.tsv>");
}
await buildMap(out);
