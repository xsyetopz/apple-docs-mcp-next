import { z } from "zod";

import { AppError, ErrorType } from "../core/errors.ts";
import { handleFindSimilarApis } from "../docs/find-similar-apis.ts";
import { handleGetPlatformCompatibility } from "../docs/get-platform-compatibility.ts";
import { handleGetRelatedApis } from "../docs/get-related-apis.ts";
import { handleResolveReferencesBatch } from "../docs/resolve-references-batch.ts";
import { absoluteAppleUrl } from "../docs/url-converter.ts";
import { defineTool } from "./define-tool.ts";

const REFERENCE_FILTERS = [
  "all",
  "symbol",
  "collection",
  "article",
  "protocol",
  "class",
  "struct",
  "enum",
] as const;

const DEFAULT_LIMITS = { related: 10, references: 20, similar: 15 } as const;

export const getApiRelationsTool = defineTool({
  name: "get_api_relations",
  title: "Get API Relations",
  description:
    'Related, similar, referenced or platform-availability data for one documentation page, from its JSON. kind "related": inheritance, conformances, See Also, Topics. "similar": alternatives, led by the replacement of a deprecated API. "references": pages it links to, with declarations. "platforms": introduced and deprecated versions.',
  inputSchema: z.object({
    url: z
      .string()
      .describe(
        'Documentation page URL or site path, e.g. "/documentation/uikit/uiview"',
      ),
    kind: z.enum(["related", "references", "similar", "platforms"]),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe(
        "related: per group (default 10); references: total (20); similar: total (15). Not used by platforms.",
      ),
    filter: z
      .string()
      .optional()
      .describe(
        `references: ${REFERENCE_FILTERS.join(", ")}. similar: text in a group title, e.g. "Animation".`,
      ),
    depth: z
      .enum(["shallow", "medium", "deep"])
      .optional()
      .describe(
        'similar: how far to read (default "medium"). platforms: "medium" or "deep" adds related APIs (default "shallow").',
      ),
  }),
  run: async ({ url: input, kind, limit, filter, depth }) => {
    const url = absoluteAppleUrl(input);
    switch (kind) {
      case "related":
        return await handleGetRelatedApis({
          apiUrl: url,
          includeInherited: true,
          includeConformance: true,
          includeSeeAlso: true,
          limit: limit ?? DEFAULT_LIMITS.related,
        });
      case "references":
        return await handleResolveReferencesBatch({
          sourceUrl: url,
          maxReferences: limit ?? DEFAULT_LIMITS.references,
          filterByType: referenceFilter(filter),
        });
      case "similar":
        return await handleFindSimilarApis({
          apiUrl: url,
          searchDepth: depth ?? "medium",
          filterByCategory: filter,
          includeAlternatives: true,
          limit: limit ?? DEFAULT_LIMITS.similar,
        });
      case "platforms":
        return await handleGetPlatformCompatibility({
          apiUrl: url,
          compareMode:
            depth === undefined || depth === "shallow" ? "single" : "framework",
          includeRelated: depth !== undefined && depth !== "shallow",
        });
    }
  },
});

const referenceFilter = (filter: string | undefined): string => {
  if (filter === undefined) {
    return "all";
  }
  if (!(REFERENCE_FILTERS as readonly string[]).includes(filter)) {
    throw new AppError({
      type: ErrorType.INVALID_INPUT,
      message: `Unknown filter "${filter}" for kind "references"`,
      suggestions: [`Use one of: ${REFERENCE_FILTERS.join(", ")}`],
    });
  }
  return filter;
};
