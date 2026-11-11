/**
 * Document formatting utilities
 */

import { APPLE_URLS } from "../core/constants.ts";
import type {
	PlatformAvailability,
	RenderInlineContent,
	RenderNode,
	RenderReference,
} from "../types/docc.ts";
import { isTopicReference } from "../types/docc.ts";

type References = RenderNode["references"];

/**
 * Whether a string that may be missing has any characters
 */
export const hasText = (text: string | null | undefined): text is string =>
	text !== undefined && text !== null && text !== "";

const formatInline = (
	inline: RenderInlineContent,
	references: References,
): string => {
	if (inline.type === "text") {
		return inline.text;
	}
	if (inline.type === "codeVoice") {
		return `\`${inline.code}\``;
	}
	if (inline.type === "strong") {
		return `**${formatInlineContent(inline.inlineContent, references)}**`;
	}
	if (inline.type === "emphasis") {
		return `*${formatInlineContent(inline.inlineContent, references)}*`;
	}
	if (inline.type === "link") {
		return `[${inline.title}](${inline.destination})`;
	}
	if (inline.type === "reference") {
		return formatReference(inline, references);
	}
	return inline.type === "image"
		? formatImage(inline.identifier, references)
		: "";
};

/**
 * Format inline content: text, code voice, links and references, keeping strong and emphasized runs
 */
export const formatInlineContent = (
	inlineContent: RenderInlineContent[],
	references: References,
): string =>
	inlineContent.map((inline) => formatInline(inline, references)).join("");

/**
 * A reference reads as the words the page links (its overriding title), else its target's title; a symbol is code.
 * An active one links to its target, as Apple's pages do.
 */
const formatReference = (
	inline: Extract<RenderInlineContent, { type: "reference" }>,
	references: References,
): string => {
	const target = references?.[inline.identifier];
	const title =
		inline.overridingTitle ??
		(target && "title" in target ? target.title : undefined) ??
		inline.identifier.split("/").pop() ??
		"";
	const text =
		isTopicReference(target) && target.kind === "symbol"
			? `\`${title}\``
			: title;
	const url = inline.isActive ? referenceUrl(target) : undefined;
	return hasText(url) ? `[${text}](${url})` : text;
};

/**
 * Where an asset loads from (an image, a sample's download, a tutorial's project files): its path, with or without a
 * leading slash, is from the pages' base, as swift-docc-render resolves it; a full URL stays as it is
 */
const assetUrl = (path: string): string =>
	new URL(path.replace(/^\//u, ""), APPLE_URLS.ASSETS).href;

/**
 * Where a reference leads: a page (a WWDC session's carries a full URL; a page's, a site path, kept as one because
 * full URLs were a third of a long page), a link, or a download
 */
export const referenceUrl = (
	ref: RenderReference | undefined,
): string | undefined => {
	if (isTopicReference(ref)) {
		return ref.url;
	}
	if (ref?.type === "link") {
		return ref.url;
	}
	return ref?.type === "download" || ref?.type === "externalLocation"
		? assetUrl(ref.url)
		: undefined;
};

/**
 * The site path of a page Apple names by its doc:// identifier: doc://<bundle>/<path> is developer.apple.com/<path>
 */
export const docUrl = (identifier: string): string =>
	`/${identifier.replace(/^doc:\/\/[^/]+\//u, "")}`;

/**
 * An image as Markdown: Apple's alt text, which carries what the image shows, and its light 2x file
 */
export const formatImage = (
	identifier: string,
	references: References,
): string => {
	const image = references?.[identifier];
	if (image?.type !== "image") {
		return "";
	}
	const file =
		image.variants.find((variant) => variant.traits.includes("light")) ??
		image.variants[0];
	if (!file) {
		return image.alt ?? "";
	}
	return `![${image.alt ?? ""}](${assetUrl(file.url)})`;
};

/**
 * A link to a page the JSON names by identifier, titled as the page's references title it; a symbol is code
 */
export const formatIdentifierLink = (
	identifier: string,
	references: References,
): string => {
	const ref = references?.[identifier];
	if (isTopicReference(ref)) {
		return `[${ref.kind === "symbol" ? `\`${ref.title}\`` : ref.title}](${referenceUrl(ref)})`;
	}
	return `[\`${identifier.split("/").pop() ?? identifier}\`](${docUrl(identifier)})`;
};

/**
 * A Topics or See Also line: the page's link, a symbol's titled with its declaration, then the one-line summary its
 * reference carries, as Apple's pages list a type's members
 */
export const formatIdentifierLine = (
	identifier: string,
	references: References,
	withSummary = true,
): string => {
	const ref = references?.[identifier];
	const summary =
		withSummary && isTopicReference(ref) && ref.abstract !== undefined
			? formatInlineContent(ref.abstract, references).trim()
			: "";
	const declaration = isTopicReference(ref)
		? (ref.fragments ?? []).map((fragment) => fragment.text).join("")
		: "";
	const link =
		isTopicReference(ref) && declaration !== ""
			? `[\`${declaration}\`](${referenceUrl(ref)})`
			: formatIdentifierLink(identifier, references);
	return `- ${link}${summary === "" ? "" : `: ${summary}`}\n`;
};

/**
 * " 17.0+" after a platform's name, or nothing when the page's JSON gives no version: Apple's site then shows the name
 * alone (swift-docc-render's AvailabilityRange), as on XCUIAutomation's pages.
 */
export const formatIntroducedVersion = (
	platform: PlatformAvailability,
): string =>
	hasText(platform.introducedAt) ? ` ${platform.introducedAt}+` : "";
