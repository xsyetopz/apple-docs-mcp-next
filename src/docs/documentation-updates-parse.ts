import type {
	RenderIndex,
	RenderIndexNode,
	RenderNode,
	TasksGroupSection,
} from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";
import { formatInlineContent } from "./doc-formatter.ts";

export type UpdateCategory = "wwdc" | "technology" | "release-notes" | "other";

export interface UpdateItem {
	title: string;
	url: string;
	description: string;
	category: UpdateCategory;
	type: string;
	identifier: string;
	technology?: string | undefined;
	year?: string | undefined;
	beta?: boolean | undefined;
	images?: { type: string; identifier: string }[] | undefined;
}

const getSectionCategory = (title: string): UpdateCategory => {
	const lowerTitle = title.toLowerCase();
	if (lowerTitle.includes("wwdc")) {
		return "wwdc";
	}
	if (lowerTitle.includes("release notes")) {
		return "release-notes";
	}
	if (lowerTitle.includes("technology")) {
		return "technology";
	}
	return "other";
};

const extractTechnologyFromPath = (path: string): string | undefined => {
	const name = /\/documentation\/updates\/([^/]+)/iu.exec(path)?.[1];
	if (name === undefined) {
		return undefined;
	}
	return name
		.replaceAll("-", " ")
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

const sectionItems = (
	section: TasksGroupSection,
	updatesData: RenderNode,
): UpdateItem[] => {
	const sectionCategory = getSectionCategory(section.title ?? "");

	return section.identifiers.flatMap((identifier) => {
		const reference = updatesData.references?.[identifier];
		if (!isTopicReference(reference)) {
			return [];
		}
		const category = /^WWDC\d{2,4}\b/u.test(reference.title)
			? "wwdc"
			: sectionCategory;
		const updateItem: UpdateItem = {
			title: reference.title,
			url: reference.url ?? "",
			description: formatInlineContent(
				reference.abstract ?? [],
				updatesData.references,
			).trim(),
			category,
			type: reference.kind,
			identifier,
			images: reference.images,
		};

		const yearDigits = /WWDC(\d{2,4})/u.exec(reference.title)?.[1];
		if (category === "wwdc" && yearDigits !== undefined) {
			updateItem.year =
				yearDigits.length === 2 ? `20${yearDigits}` : yearDigits;
		}

		return [updateItem];
	});
};

const processIndexSection = (
	sections: RenderIndexNode[],
	updates: UpdateItem[],
): void => {
	for (const section of sections) {
		const path = section.path ?? "";
		const matchingUpdate = updates.find(
			(update) =>
				(path !== "" && update.url.includes(path)) ||
				update.title === section.title,
		);

		if (matchingUpdate) {
			matchingUpdate.beta = section.beta ?? false;
			if (matchingUpdate.category === "technology") {
				matchingUpdate.technology = extractTechnologyFromPath(path);
			}
		}

		if (section.children) {
			processIndexSection(section.children, updates);
		}
	}
};

export const parseUpdates = (
	updatesData: RenderNode,
	updatesIndex: RenderIndex,
): UpdateItem[] => {
	const updates = (updatesData.topicSections ?? []).flatMap((section) =>
		sectionItems(section, updatesData),
	);

	const swiftIndex = updatesIndex.interfaceLanguages?.["swift"];
	if (swiftIndex) {
		processIndexSection(swiftIndex, updates);
	}

	return updates;
};
