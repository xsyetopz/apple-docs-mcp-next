interface Metadata {
	title?: string;
	permalink?: string;
	kind?: string;
	description?: string;
	hierarchy?: string;
}

export const result = (
	title: string,
	path: string,
	extra: Metadata = {},
): unknown => ({
	value: {
		metadata: {
			title,
			permalink: `https://developer.apple.com${path}`,
			kind: "symbol",
			...extra,
		},
	},
});

/** A video as Apple's search API returns it: every field a one-element list, its id `<event>-<number>`. */
export const wwdcSession = (id: string, title: string): unknown => ({
	value: {
		metadata: {
			ids: [id],
			titles: [title],
			itemTypes: ["Video"],
			descriptions: ["A session."],
			permalinks: [
				`https://developer.apple.com/videos/play/${id.replace(/-(\d+)$/u, "/$1")}`,
			],
		},
	},
});

/**
 * The JSON lines Apple's search API streams: `search` events build one results document, each trimming
 * `removeLast` characters before appending. The second event takes back the first one's last two characters.
 */
export const stream = (results: unknown[]): string => {
	const document = JSON.stringify({ results });
	const cut = Math.floor(document.length / 2);
	return [
		JSON.stringify({
			kind: "search",
			diff: { append: `${document.slice(0, cut)}"x` },
		}),
		JSON.stringify({
			kind: "search",
			diff: { removeLast: 2, append: document.slice(cut) },
		}),
		JSON.stringify({ kind: "searchFinished" }),
	].join("\n");
};
