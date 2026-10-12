/**
 * Document formatting utilities
 */

import type {
  PlatformAvailability,
  RenderInlineContent,
  RenderNode,
  RenderReference,
} from "../types/docc.ts";
import { isDeprecated, isTopicReference } from "../types/docc.ts";
import { APPLE_URLS } from "../utils/constants.ts";

type References = RenderNode["references"];

/**
 * Format inline content: text, code voice, links and references, keeping strong and emphasized runs
 */
export function formatInlineContent(
  inlineContent: RenderInlineContent[],
  references: References,
): string {
  return inlineContent
    .map((inline) => {
      switch (inline.type) {
        case "text":
          return inline.text;
        case "codeVoice":
          return `\`${inline.code}\``;
        case "strong":
          return `**${formatInlineContent(inline.inlineContent, references)}**`;
        case "emphasis":
          return `*${formatInlineContent(inline.inlineContent, references)}*`;
        case "link":
          return `[${inline.title}](${inline.destination})`;
        case "reference":
          return formatReference(inline, references);
        case "image":
          return formatImage(inline.identifier, references);
        default:
          return "";
      }
    })
    .join("");
}

/**
 * A reference reads as the words the page links (its overriding title), else its target's title; a symbol is code.
 * An active one links to its target, as Apple's pages do.
 */
function formatReference(
  inline: Extract<RenderInlineContent, { type: "reference" }>,
  references: References,
): string {
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
  return url ? `[${text}](${url})` : text;
}

/**
 * Where an asset loads from (an image, a sample's download, a tutorial's project files): its path, with or without a
 * leading slash, is from the pages' base, as swift-docc-render resolves it; a full URL stays as it is
 */
export function assetUrl(path: string): string {
  return new URL(path.replace(/^\//, ""), APPLE_URLS.ASSETS).href;
}

/**
 * Where a reference leads: a page (a WWDC session's carries a full URL; a page's, a site path), a link, or a download
 */
export function referenceUrl(
  ref: RenderReference | undefined,
): string | undefined {
  if (isTopicReference(ref)) {
    return ref.url.startsWith("http")
      ? ref.url
      : `${APPLE_URLS.BASE}${ref.url}`;
  }
  if (ref?.type === "link") {
    return ref.url;
  }
  return ref?.type === "download" || ref?.type === "externalLocation"
    ? assetUrl(ref.url)
    : undefined;
}

/**
 * The web address of a page Apple names by its doc:// identifier: doc://<bundle>/<path> is developer.apple.com/<path>
 */
export function docUrl(identifier: string): string {
  return `${APPLE_URLS.BASE}/${identifier.replace(/^doc:\/\/[^/]+\//, "")}`;
}

/**
 * An image as Markdown: Apple's alt text, which carries what the image shows, and its light 2x file
 */
export function formatImage(
  identifier: string,
  references: References,
): string {
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
}

/**
 * A link to a page the JSON names by identifier, titled as the page's references title it; a symbol is code
 */
export function formatIdentifierLink(
  identifier: string,
  references: References,
): string {
  const ref = references?.[identifier];
  if (isTopicReference(ref)) {
    return `[${ref.kind === "symbol" ? `\`${ref.title}\`` : ref.title}](${referenceUrl(ref)})`;
  }
  // Unlisted in the references: its identifier is still its address
  return `[\`${identifier.split("/").pop() ?? identifier}\`](${docUrl(identifier)})`;
}

/**
 * A Topics or See Also line: the page's link, a symbol's titled with its declaration, then the one-line summary its
 * reference carries, as Apple's pages list a type's members
 */
export function formatIdentifierLine(
  identifier: string,
  references: References,
): string {
  const ref = references?.[identifier];
  const summary =
    isTopicReference(ref) && ref.abstract
      ? formatInlineContent(ref.abstract, references).trim()
      : "";
  const declaration = isTopicReference(ref)
    ? (ref.fragments ?? []).map((fragment) => fragment.text).join("")
    : "";
  const link =
    isTopicReference(ref) && declaration
      ? `[\`${declaration}\`](${referenceUrl(ref)})`
      : formatIdentifierLink(identifier, references);
  return `- ${link}${summary ? `: ${summary}` : ""}\n`;
}

/**
 * Format document header with title and status
 */
export function formatDocumentHeader(jsonData: RenderNode): string {
  let content = "";

  // Add title with status information
  const title = jsonData.metadata?.title ?? "Documentation";
  const statusInfo = [];

  // Check for beta/deprecated status
  const isBeta = jsonData.metadata?.platforms?.some((p) => p.beta) ?? false;
  const deprecated = jsonData.metadata?.platforms?.some(isDeprecated) ?? false;

  if (isBeta) {
    statusInfo.push("**Beta**");
  }
  if (deprecated) {
    statusInfo.push("**Deprecated**");
  }

  const statusText = statusInfo.length > 0 ? ` (${statusInfo.join(", ")})` : "";
  content += `# ${title}${statusText}\n\n`;

  // Add role/type information with symbol kind
  if (jsonData.metadata?.roleHeading) {
    let roleInfo = `**${jsonData.metadata.roleHeading}**`;
    if (jsonData.metadata?.symbolKind) {
      roleInfo += ` (${jsonData.metadata.symbolKind})`;
    }
    content += `${roleInfo}\n\n`;
  }

  return content;
}

/**
 * Format document abstract
 */
export function formatDocumentAbstract(jsonData: RenderNode): string {
  const abstractText = formatInlineContent(
    jsonData.abstract ?? [],
    jsonData.references,
  ).trim();
  return abstractText ? `${abstractText}\n\n` : "";
}

/**
 * Format platform availability section
 */
export function formatPlatformAvailability(jsonData: RenderNode): string {
  if (
    !jsonData.metadata?.platforms ||
    !Array.isArray(jsonData.metadata.platforms)
  ) {
    return "";
  }

  let content = "## Platform Availability\n\n";

  jsonData.metadata.platforms.forEach((platform) => {
    content += formatPlatformLine(platform);
  });

  return `${content}\n`;
}

/**
 * " 17.0+" after a platform's name, or nothing when the page's JSON gives no version: Apple's site then shows the name
 * alone (swift-docc-render's AvailabilityRange), as on XCUIAutomation's pages.
 */
export function formatIntroducedVersion(
  platform: PlatformAvailability,
): string {
  return platform.introducedAt ? ` ${platform.introducedAt}+` : "";
}

/**
 * Format a single platform line
 */
function formatPlatformLine(platform: PlatformAvailability): string {
  const platformStatus = [];

  if (platform.beta) {
    platformStatus.push("Beta");
  }
  if (isDeprecated(platform)) {
    platformStatus.push("Deprecated");
  }
  if (platform.unavailable) {
    platformStatus.push("Unavailable");
  }

  let platformLine = `- **${platform.name}**${formatIntroducedVersion(platform)}`;

  if (platform.deprecatedAt) {
    platformLine += ` | Deprecated in ${platform.deprecatedAt}`;
  }
  if (platformStatus.length > 0) {
    platformLine += ` | Status: ${platformStatus.join(", ")}`;
  }

  return `${platformLine}\n`;
}

/**
 * Format See Also section
 */
export function formatSeeAlsoSection(jsonData: RenderNode): string {
  if (!jsonData.seeAlsoSections || !Array.isArray(jsonData.seeAlsoSections)) {
    return "";
  }

  let content = "## See Also\n\n";

  jsonData.seeAlsoSections.forEach((seeAlso) => {
    if (seeAlso.title && seeAlso.identifiers) {
      content += `### ${seeAlso.title}\n\n`;
      content += formatSeeAlsoIdentifiers(
        seeAlso.identifiers,
        jsonData.references,
      );
    }
  });

  return content;
}

/**
 * Format See Also identifiers
 */
function formatSeeAlsoIdentifiers(
  identifiers: string[],
  references: References,
): string {
  return `${identifiers
    .map((identifier) => formatIdentifierLine(identifier, references))
    .join("")}\n`;
}

/**
 * Check if document is a specific API
 */
export function isSpecificAPIDocument(jsonData: RenderNode): boolean {
  // A web-service endpoint has no declaration; its URL is its signature
  return (
    jsonData.primaryContentSections?.some(
      (section) =>
        "kind" in section &&
        (section.kind === "declarations" || section.kind === "restEndpoint"),
    ) ?? false
  );
}
