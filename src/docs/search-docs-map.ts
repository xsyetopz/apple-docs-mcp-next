import path from "node:path";

/** The docs map `scripts/build-docs-map.ts` writes: url, title, kind, technology, group and tree, one page a row */
const MAP = Bun.file(
	path.join(import.meta.dir, "../../api-map/apple-docs-map.tsv"),
);

/** A `technology` the map has no pages for: answered as an error, not as "no page has it", which a typo would fake */
class UnknownTechnologyError extends Error {}

interface MapRow {
	url: string;
	title: string;
	kind: string;
	technology: string;
}

export interface DocsMapQuery {
	query: string;
	technology?: string[] | undefined;
	limit: number;
}

const compareRows = (a: string, b: string): number => {
	if (a < b) {
		return -1;
	}
	return a > b ? 1 : 0;
};

const readRows = async (): Promise<MapRow[]> => {
	const map = await MAP.text();
	return map
		.split("\n")
		.slice(1)
		.map((line) => {
			const [url = "", title = "", kind = "", technology = ""] =
				line.split("\t");
			return { url, title, kind, technology };
		});
};

const assertKnownTechnologies = (
	rows: MapRow[],
	technologies: string[],
): void => {
	const known = new Set(rows.map((row) => row.technology.toLowerCase()));
	const unknown = technologies.filter((name) => !known.has(name.toLowerCase()));
	if (unknown.length > 0) {
		throw new UnknownTechnologyError(
			`The docs map has no technology named ${unknown.map((name) => `"${name}"`).join(", ")}; ` +
				'use a name as list_technologies or these results show it ("SwiftUI", "Human Interface Guidelines").',
		);
	}
};

const findHits = (
	rows: MapRow[],
	needle: string,
	wanted: Set<string> | undefined,
): (MapRow & { row: string })[] =>
	rows
		.filter(
			(row) =>
				row.title.toLowerCase().includes(needle) &&
				(wanted === undefined || wanted.has(row.technology.toLowerCase())),
		)
		.map(({ url, title, kind, technology }) => ({
			url,
			title,
			kind,
			technology,
			row: `${title}\t${technology}\t${url}`,
		}))
		.toSorted(
			(a, b) => a.title.length - b.title.length || compareRows(a.row, b.row),
		);

/**
 * The pages whose title contains `query`, in any case and as typed, shortest titles first, within `technologies` when
 * given: the docs map's shell search (awk, sort -n, head) as a tool, without awk reading `(`, `.` or `*` in a Swift
 * name as a pattern. Ties in length keep sort's order of the printed row, as the shell search does.
 */
export const handleSearchDocsMap = async ({
	query,
	technology: technologies,
	limit,
}: DocsMapQuery): Promise<string> => {
	const rows = await readRows();
	const builtAt = MAP.lastModified;
	const wanted =
		technologies && new Set(technologies.map((name) => name.toLowerCase()));
	if (technologies) {
		assertKnownTechnologies(rows, technologies);
	}
	const hits = findHits(rows, query.toLowerCase(), wanted);
	const date = new Date(builtAt).toLocaleDateString("en-CA");
	const scope = technologies ? ` in ${technologies.join(", ")}` : "";
	if (hits.length === 0) {
		return (
			`No page${scope} in the docs map (built ${date}) has "${query}" in its title. ` +
			"Search by what it does with search_apple_docs."
		);
	}
	const shown = hits.slice(0, limit);
	const count =
		hits.length === 1
			? "1 page has it in its title"
			: `${hits.length} pages have it in their title`;
	return [
		`# Docs map: "${query}"${scope}`,
		`${count}. The map was built ${date}; read a page with get_apple_doc_content.`,
		"",
		...shown.map(
			({ url, title, kind, technology }) =>
				`- [${title}](${url}) · ${kind} · ${technology}`,
		),
		...(shown.length < hits.length
			? [
					"",
					`Showing the ${shown.length} shortest of ${hits.length}. Narrow with technology or a longer query, or raise limit.`,
				]
			: []),
	].join("\n");
};
