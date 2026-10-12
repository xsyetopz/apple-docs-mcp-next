/**
 * Apple's documentation JSON, typed by openapi-typescript from Swift-DocC's published specs, RenderNode.spec.json
 * (pages) and RenderIndex.spec.json (navigator indexes): `npm run types:docc` regenerates docc/.
 */

import type { components as RenderIndexSpec } from "./docc/render-index.ts";
import type { components as RenderNodeSpec } from "./docc/render-node.ts";

type Schemas = RenderNodeSpec["schemas"];

/** A documentation page: an API symbol or an article */
export type RenderNode = Schemas["DocumentationRenderNode"];
export type RenderReference = Schemas["RenderReference"];
export type TopicRenderReference = Schemas["TopicRenderReference"];
export type RenderInlineContent = Schemas["RenderInlineContent"];
export type TasksGroupSection = Schemas["TasksGroupSection"];
export type RelationshipsGroupSection = Schemas["RelationshipsGroupSection"];
export type PlatformAvailability = Schemas["PlatformAvailability"];
/**
 * A tutorials page's parts (an overview's volumes, a tutorial's tasks); documentation pages have none. Apple's heroes
 * also name the tutorial's project download, `projectFiles`, which the spec leaves out (2026-10-10).
 */
/** A web-service page's parts: a property, parameter or body field, its type's tokens, and a property's attribute */
export type TypedProperty = Schemas["TypedProperty"];
export type DeclarationToken = Schemas["DeclarationToken"];
export type Attribute = Schemas["Attribute"];
export type DocumentationPrimaryRenderSection =
  Schemas["DocumentationPrimaryRenderSection"];
export type RenderSection =
  | Exclude<Schemas["RenderSection"], Schemas["IntroRenderSection"]>
  | (Schemas["IntroRenderSection"] & { projectFiles?: string });

/** A navigator index (index/<framework>, index/updates, index/technologyoverviews) and one node of its tree */
export type RenderIndex = RenderIndexSpec["schemas"]["RenderIndex"];
export type RenderIndexNode = RenderIndexSpec["schemas"]["Node"];

/** The spec tags tab and row blocks with `kind`; Apple's pages tag them with `type` (HIG tab bars, 2026-10-06) */
type TaggedByType<Block extends { kind: string }> = Omit<Block, "kind"> & {
  type: Block["kind"];
};
export type RenderBlockContent =
  | Schemas["RenderBlockContent"]
  | TaggedByType<Schemas["TabNavigator"]>
  | TaggedByType<Schemas["Row"]>;

/** Apple marks a deprecation with the version that made it, leaving `deprecated` false (UIAlertView, 2026-10-06) */
export const isDeprecated = (platform: PlatformAvailability): boolean => {
  return Boolean(platform.deprecated) || platform.deprecatedAt !== undefined;
};

/** A reference to a page; the others are a page's images, videos, files and links */
export const isTopicReference = (
  reference: RenderReference | undefined,
): reference is TopicRenderReference => {
  return reference?.type === "topic" || reference?.type === "section";
};
