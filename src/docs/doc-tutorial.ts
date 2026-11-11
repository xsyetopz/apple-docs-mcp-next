import type { RenderNode, RenderSection } from "../types/docc.ts";
import {
	formatContentItems,
	formatStep,
	type References,
} from "./doc-blocks.ts";
import {
	formatIdentifierLine,
	hasText,
	referenceUrl,
} from "./doc-formatter.ts";

/**
 * A tutorials page's sections, which documentation pages leave empty: an overview's volumes, a tutorial's tasks and an
 * article's body; its questions and the link to what comes next are left out. The page header gives the hero's title.
 */
export const formatTutorialSections = (jsonData: RenderNode): string =>
	(jsonData.sections ?? [])
		.map((section) => formatTutorialSection(section, jsonData.references))
		.join("");

const formatTutorialSection = (
	section: RenderSection,
	references: References,
): string => {
	if (section.kind === "hero" || section.kind === "intro") {
		const projectFiles = hasText(section.projectFiles)
			? referenceUrl(references?.[section.projectFiles])
			: undefined;
		return (
			formatContentItems(section.content ?? [], references) +
			(hasText(projectFiles) ? `[Project files](${projectFiles})\n\n` : "")
		);
	}
	if (section.kind === "articleBody") {
		return formatContentItems(section.content, references);
	}
	if (section.kind === "volume") {
		const chapters = section.chapters
			.map((chapter) => {
				const tutorials = chapter.tutorials
					.map((identifier) => formatIdentifierLine(identifier, references))
					.join("");
				return `### ${chapter.name}\n\n${formatContentItems(chapter.content, references)}${tutorials}\n`;
			})
			.join("");
		const name = hasText(section.name) ? `## ${section.name}\n\n` : "";
		return `${name}${formatContentItems(section.content ?? [], references)}${chapters}`;
	}
	if (section.kind === "tasks") {
		return section.tasks
			.map((task) => {
				const steps = task.stepsSection
					.map((block) => formatStep(block, references))
					.join("");
				return `## ${task.title}\n\n${formatContentItems(task.contentSection, references)}${steps}`;
			})
			.join("");
	}
	return "";
};
