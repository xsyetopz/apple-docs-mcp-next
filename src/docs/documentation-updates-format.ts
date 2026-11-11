import type { UpdateItem } from "./documentation-updates-parse.ts";

const categoryTitles: Record<string, string> = {
	wwdc: "WWDC",
	technology: "Technology Updates",
	"release-notes": "Release Notes",
	other: "Other Updates",
};

const formatItem = (item: UpdateItem): string => {
	const metadata: string[] = [];
	if (item.beta === true) {
		metadata.push("Beta");
	}
	if (item.images?.some((img) => img.identifier === "new.svg") === true) {
		metadata.push("New");
	}

	const technology = item.technology ?? "";
	if (technology && item.category !== "technology") {
		metadata.push(technology);
	}
	const year = item.year ?? "";
	if (year && item.category === "wwdc") {
		metadata.push(year);
	}

	const badges = metadata.length > 0 ? ` (${metadata.join(", ")})` : "";
	const description = item.description ? `: ${item.description}` : "";
	return `- [${item.title}](${item.url})${badges}${description}\n`;
};

export const formatUpdatesList = (
	updates: UpdateItem[],
	total: number,
): string => {
	if (updates.length === 0) {
		return "No documentation updates found matching the specified criteria.";
	}

	let content = `# Apple Developer Documentation Updates\n${total} updates\n`;

	const grouped = new Map<string, UpdateItem[]>();
	for (const update of updates) {
		grouped.set(update.category, [
			...(grouped.get(update.category) ?? []),
			update,
		]);
	}

	for (const [category, items] of grouped) {
		content += `\n## ${categoryTitles[category] ?? category}\n`;

		if (category === "wwdc") {
			content +=
				"For session transcripts and code, use list_wwdc_videos, search_wwdc_content and get_wwdc_video.\n";
		}

		content += items.map((item) => formatItem(item)).join("");
	}

	if (total > updates.length) {
		content += `\nShowing ${updates.length} of ${total}. Narrow with category, technology or searchQuery, or raise limit.\n`;
	}

	return content.trimEnd();
};
