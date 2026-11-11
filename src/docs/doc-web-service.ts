import type {
	Attribute,
	DeclarationToken,
	DocumentationPrimaryRenderSection,
	TypedProperty,
} from "../types/docc.ts";
import {
	formatContentItems,
	formatOneLine,
	type References,
} from "./doc-blocks.ts";
import { hasText, referenceUrl } from "./doc-formatter.ts";

type WebServiceSection = Extract<
	DocumentationPrimaryRenderSection,
	{ kind: string }
>;

/**
 * A web-service page's sections: an endpoint's URL, parameters, body and responses; an object's properties; a type's
 * possible values. Other kinds (mentions, details) are left out.
 */
export const formatWebServiceSection = (
	section: WebServiceSection,
	references: References,
): string => {
	const fields = (items: TypedProperty[]): string =>
		items.map((item) => formatTypedProperty(item, references)).join("");
	if (section.kind === "restEndpoint") {
		return `## ${section.title}\n\n\`\`\`\n${section.tokens.map((token) => token.text).join("")}\n\`\`\`\n\n`;
	}
	if (section.kind === "restParameters") {
		return `## ${section.title}\n\n${fields(section.items)}\n`;
	}
	if (section.kind === "properties") {
		return `## ${section.title}\n\n${fields(section.items ?? [])}\n`;
	}
	if (section.kind === "restBody") {
		return (
			`## ${section.title}\n\n${formatTypeTokens(section.bodyContentType, references)} (${section.mimeType})\n\n` +
			`${formatContentItems(section.content ?? [], references)}${fields(section.parameters ?? [])}\n`
		);
	}
	if (section.kind === "restResponses") {
		return `## ${section.title}\n\n${section.items
			.map((response) => {
				const about = formatOneLine(response.content ?? [], references);
				const reason = hasText(response.reason) ? ` ${response.reason}` : "";
				const mimeType = hasText(response.mimeType)
					? ` (${response.mimeType})`
					: "";
				return (
					`- ${response.status}${reason}: ${formatTypeTokens(response.type, references)}` +
					`${mimeType}${about ? `. ${about}` : ""}\n`
				);
			})
			.join("")}\n`;
	}
	if (section.kind === "possibleValues") {
		return `${hasText(section.title) ? `## ${section.title}\n\n` : ""}${section.values
			.map((value) => {
				const about = formatOneLine(value.content ?? [], references);
				return `- \`${value.name}\`${about ? `: ${about}` : ""}\n`;
			})
			.join("")}\n`;
	}
	return "";
};

/**
 * A property, parameter or body field on one line: its name, type, flags, description and attributes
 */
const formatTypedProperty = (
	property: TypedProperty,
	references: References,
): string => {
	const flags = [
		property.required === true && "required",
		property.readOnly === true && "read-only",
		property.deprecated === true && "deprecated",
	]
		.filter((flag) => flag !== false)
		.map((flag) => `, ${flag}`)
		.join("");
	const notes = [
		formatOneLine(property.content ?? [], references),
		...(property.attributes ?? []).map((attribute) =>
			formatAttribute(attribute, references),
		),
	]
		.filter((note) => note !== "")
		.join("; ");
	return `- \`${property.name}\` (${formatTypeTokens(property.type, references)}${flags})${notes ? `: ${notes}` : ""}\n`;
};

/**
 * swift-docc-render's labels for an attribute that comes without a title (its `parameters` strings)
 */
const ATTRIBUTE_LABELS: Record<Attribute["kind"], string> = {
	default: "Default",
	minimum: "Minimum",
	minimumExclusive: "Minimum",
	maximum: "Maximum",
	maximumExclusive: "Maximum",
	allowedValues: "Possible Values",
	allowedTypes: "Possible types",
};

/**
 * A property's default, bound, allowed values or allowed types
 */
const formatAttribute = (
	attribute: Attribute,
	references: References,
): string => {
	const label = attribute.title ?? ATTRIBUTE_LABELS[attribute.kind];
	if (attribute.kind === "allowedValues") {
		return `${label}: ${attribute.values.map((value) => `\`${value}\``).join(", ")}`;
	}
	if (attribute.kind === "allowedTypes") {
		return `${label}: ${attribute.values.map((type) => formatTypeTokens(type, references)).join(", ")}`;
	}
	return `${label}: ${attribute.value}`;
};

/**
 * A type's tokens as text, each token with a page linked to it
 */
const formatTypeTokens = (
	tokens: DeclarationToken[],
	references: References,
): string =>
	tokens
		.map((token) => {
			const url = hasText(token.identifier)
				? referenceUrl(references?.[token.identifier])
				: undefined;
			return hasText(url) ? `[\`${token.text}\`](${url})` : token.text;
		})
		.join("");
