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
import { fetchRenderIndex, fetchRenderNode } from "../src/docs/docc-json.ts";
import { helpPagesOf } from "../src/docs/help-pages.ts";
import type { RenderIndexNode, RenderNode } from "../src/types/docc.ts";
import { isTopicReference } from "../src/types/docc.ts";
import { inOrder } from "./in-order.ts";

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
		const path = node.path ?? "";
		const own =
			path === ""
				? []
				: [
						{
							url: SITE + path,
							title: node.title,
							kind: node.type ?? "",
							technology: technology.title,
							group,
							tree: ancestors.join(" › "),
							home: technology.url,
						},
					];
		return [
			...own,
			...rowsOf(node.children ?? [], technology, [...ancestors, node.title]),
		];
	});
};

interface Pending {
	path: string;
	ancestors: string[];
}

const higChildren = (
	page: RenderNode,
	ancestors: string[],
	seen: Set<string>,
): { rows: Row[]; pending: Pending[] } => {
	const rows: Row[] = [];
	const pending: Pending[] = [];
	for (const section of page.topicSections ?? []) {
		for (const identifier of section.identifiers) {
			const ref = page.references?.[identifier];
			if (
				isTopicReference(ref) &&
				ref.url.startsWith(HIG.path) &&
				!seen.has(ref.url)
			) {
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
				pending.push({ path: ref.url, ancestors });
			}
		}
	}
	return { rows, pending };
};

const crawlHig = async (
	queue: Pending[],
	seen: Set<string>,
	rows: Row[],
): Promise<void> => {
	const [next, ...rest] = queue;
	if (next) {
		const page = await fetchRenderNode(
			`${APPLE_URLS.TUTORIALS_DATA}${next.path.slice(1)}.json`,
		);
		await sleep(PACE_MS);
		const ancestors = [...next.ancestors, page.metadata?.title ?? next.path];
		const found = higChildren(page, ancestors, seen);
		rows.push(...found.rows);
		await crawlHig([...rest, ...found.pending], seen, rows);
	}
};

/** The HIG's pages, breadth-first from its root through each page's Topics */
const higRows = async (): Promise<Row[]> => {
	const rows: Row[] = [];
	await crawlHig(
		[{ path: HIG.path, ancestors: [] }],
		new Set([HIG.path]),
		rows,
	);
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

interface Failure {
	technology: string;
	error: string;
}

type Technology = Parameters<typeof rowsOf>[1];

const technologyRows = async (
	technology: Technology,
	name: string,
): Promise<Row[]> => {
	const index = await fetchRenderIndex(
		`${APPLE_URLS.TUTORIALS_DATA}index/${name}`,
	);
	const languages = index.interfaceLanguages ?? {};
	// Web-service references (App Store Connect API) index their pages under `data`
	const nodes = [languages["swift"], languages["occ"], languages["data"]].find(
		(candidate) => (candidate?.length ?? 0) > 0,
	);
	return rowsOf(nodes ?? [], technology, []);
};

const technologyRowsInOrder = async (
	technologies: Technology[],
	rows: Row[],
	failed: Failure[],
): Promise<void> => {
	await inOrder(technologies, async (technology, n) => {
		const name = technology.url.split("/").pop() ?? "";
		try {
			rows.push(...(await technologyRows(technology, name)));
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
	});
};

const clean = (text: string): string => text.replaceAll(/[\t\r\n]+/gu, " ");

const buildMap = async (out: string): Promise<void> => {
	const catalog = await fetchRenderNode(APPLE_URLS.TECHNOLOGIES_JSON);
	const technologies = Object.values(catalog.references ?? {})
		.filter((ref) => isTopicReference(ref))
		.filter(
			(ref) =>
				ref.role === "collection" && ref.url.startsWith("/documentation/"),
		);
	const rows: Row[] = [];
	const failed: Failure[] = [];
	await technologyRowsInOrder(technologies, rows, failed);
	rows.push(...(await higRows()), ...(await helpRows()));
	const pages = byUrl(rows);
	const lines = pages.map((row) =>
		[row.url, row.title, row.kind, row.technology, row.group, row.tree]
			.map((text) => clean(text))
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
if (out === undefined || out === "") {
	throw new UsageError("usage: bun scripts/build-docs-map.ts <out.tsv>");
}
await buildMap(out);
