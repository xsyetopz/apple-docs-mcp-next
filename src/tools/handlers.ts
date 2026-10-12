/**
 * Every tool the server offers, registered with its zod schema: the SDK lists it, checks a call's arguments against the
 * schema, and answers an unknown tool, bad arguments or a thrown error with an error result.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import type AppleDeveloperDocsMCPServer from "../index.ts";
import {
  findSimilarApisSchema,
  getAppleDocContentSchema,
  getDocumentationUpdatesSchema,
  getPlatformCompatibilitySchema,
  getRelatedApisSchema,
  getSampleCodeSchema,
  getTechnologyOverviewsSchema,
  listTechnologiesSchema,
  resolveReferencesBatchSchema,
  searchAppleDocsSchema,
  searchDocsMapSchema,
  searchFrameworkSymbolsSchema,
} from "../schemas/index.ts";
import {
  browseWWDCTopicsSchema,
  findRelatedWWDCVideosSchema,
  getWWDCCodeExamplesSchema,
  getWWDCVideoSchema,
  listWWDCVideosSchema,
  searchWWDCContentSchema,
} from "../schemas/wwdc.schemas.ts";
import { handleSearchDocsMap } from "./search-docs-map.ts";
import {
  handleBrowseWWDCTopics,
  handleFindRelatedWWDCVideos,
  handleGetWWDCCodeExamples,
  handleGetWWDCVideo,
  handleListWWDCVideos,
  handleListWWDCYears,
  handleSearchWWDCContent,
} from "./wwdc/wwdc-handlers.ts";

const text = (result: string): CallToolResult => ({
  content: [{ type: "text", text: result }],
});

export function registerTools(
  server: McpServer,
  docs: AppleDeveloperDocsMCPServer,
): void {
  server.registerTool(
    "search_apple_docs",
    {
      title: "Search Apple Docs",
      description:
        'Search developer.apple.com the way its search page does (Apple\'s search API). Returns links, not content: each result\'s title, framework, type and Apple\'s one-line summary, grouped by section. type "all" (the default) covers documentation, the Human Interface Guidelines, sample code and App Store Connect Help, plus a WWDC Sessions section of up to 5 sessions, each with the get_wwdc_video call that reads it; "documentation", "design", "sample" or "help" (App Store Connect Help) searches only that. Read a result with get_apple_doc_content. Searches go out one at a time, 15 s apart, as Apple answers quicker ones with no results; "all" sends two.',
      inputSchema: searchAppleDocsSchema,
      annotations: { readOnlyHint: true },
    },
    ({ query, type }) => docs.searchAppleDocs(query, type),
  );

  server.registerTool(
    "get_apple_doc_content",
    {
      title: "Get Apple Doc Content",
      description:
        "One page of Apple's documentation as Markdown, rendered from the page's JSON, the data developer.apple.com builds the page from, in its Swift version: the symbol's kind, Apple's summary, its declaration, the overview with its code listings, tables, notes and images (with Apple's alt text), the Topics groups with each group's description and each member's declaration and summary, the Relationships (conforms to, inherits from, inherited by, conforming types), platform availability and the See Also links; a sample page's Download; a tutorial overview's volumes and chapters, each tutorial with its summary, and a tutorial's steps with the code file after each and its project files; a web-service page's (App Store Connect API, App Store Server API and the like) URL, parameters, body, response codes, properties and possible values. An App Store Connect Help page comes as its article converted to Markdown. Links in the text come as links. The include\u2026 flags append related APIs, referenced types, similar APIs and a platform analysis, read from the page's JSON.",
      inputSchema: getAppleDocContentSchema,
      annotations: { readOnlyHint: true },
    },
    ({
      url,
      includeRelatedApis,
      includeReferences,
      includeSimilarApis,
      includePlatformAnalysis,
    }) =>
      docs.getAppleDocContent(
        url,
        includeRelatedApis,
        includeReferences,
        includeSimilarApis,
        includePlatformAnalysis,
      ),
  );

  server.registerTool(
    "list_technologies",
    {
      title: "List Technologies",
      description:
        'Apple\'s technology index: every framework and technology with its link, its languages (swift, occ, data) and its categories, alphabetical within each category. category keeps the categories whose name contains it, or else the technologies with a tag that contains it ("Machine learning": Core ML, Create ML, Vision…), in any case; a beta technology is marked (Beta). The last segment of a technology\'s link ("swiftui", "storekit") is the framework search_framework_symbols takes.',
      inputSchema: listTechnologiesSchema,
      annotations: { readOnlyHint: true },
    },
    ({ category, language, includeBeta, limit }) =>
      docs.listTechnologies(category, language, includeBeta, limit),
  );

  server.registerTool(
    "search_framework_symbols",
    {
      title: "Search Framework Symbols",
      description:
        'The symbols in one framework\'s navigator index: each one\'s name, link and kind, without summaries. framework is the last segment of the framework\'s documentation link ("swiftui", "storekit"); symbolType keeps one kind; namePattern is a wildcard such as "*View" or "UI*", in any case; nested symbols count toward limit. Read a symbol with get_apple_doc_content.',
      inputSchema: searchFrameworkSymbolsSchema,
      annotations: { readOnlyHint: true },
    },
    ({ framework, symbolType, namePattern, language, limit }) =>
      docs.searchFrameworkSymbols(
        framework,
        symbolType,
        namePattern,
        language,
        limit,
      ),
  );

  server.registerTool(
    "search_docs_map",
    {
      title: "Search Docs Map",
      description:
        "Every page of Apple's documentation and the Human Interface Guidelines whose title contains query, in any case and as typed (no pattern syntax), from the docs map on disk (api-map/apple-docs-map.tsv, built by scripts/build-docs-map.ts; no network): each one's title, kind, technology and link, shortest titles first; technology keeps one or more frameworks. Read a page with get_apple_doc_content.",
      inputSchema: searchDocsMapSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ query, technology, limit }) =>
      text(await handleSearchDocsMap(query, technology, limit)),
  );

  server.registerTool(
    "get_related_apis",
    {
      title: "Get Related APIs",
      description:
        "The APIs one documentation page relates to, read from that page's JSON alone: what it inherits from and conforms to, its See Also group and the first 3 APIs of each Topics group, each with its link and Apple's one-line summary.",
      inputSchema: getRelatedApisSchema,
      annotations: { readOnlyHint: true },
    },
    ({ apiUrl, includeInherited, includeConformance, includeSeeAlso }) =>
      docs.getRelatedApis(
        apiUrl,
        includeInherited,
        includeConformance,
        includeSeeAlso,
      ),
  );

  server.registerTool(
    "resolve_references_batch",
    {
      title: "Resolve References Batch",
      description:
        "The pages one documentation page references, read from that page's JSON alone (no further requests): each one's title, kind, Apple's summary and, for a symbol, its declaration, grouped by kind. Takes the first maxReferences in the JSON's own order, not by relevance, and leaves out the page's images and other media; filterByType keeps one role or kind.",
      inputSchema: resolveReferencesBatchSchema,
      annotations: { readOnlyHint: true },
    },
    ({ sourceUrl, maxReferences, filterByType }) =>
      docs.resolveReferencesBatch(sourceUrl, maxReferences, filterByType),
  );

  server.registerTool(
    "get_platform_compatibility",
    {
      title: "Get Platform Compatibility",
      description:
        "Where one API is available, from its page's JSON: each platform with the version that introduced it and the version that deprecated it, with Apple's note, and the minimum versions; an API deprecated on every platform it supports is flagged as such. compareMode \"framework\" runs the same check with related APIs included.",
      inputSchema: getPlatformCompatibilitySchema,
      annotations: { readOnlyHint: true },
    },
    ({ apiUrl, compareMode, includeRelated }) =>
      docs.getPlatformCompatibility(apiUrl, compareMode, includeRelated),
  );

  server.registerTool(
    "find_similar_apis",
    {
      title: "Find Similar APIs",
      description:
        'Alternatives to one API, read from its page\'s JSON: for a deprecated API, first the pages its deprecation note names (Apple\'s replacements, scored 10/10), then its See Also group (8/10) and, with searchDepth "medium" or "deep", its Topics groups (6/10); "deep" also reads the See Also of the first results. The scores come from where an API was found, not from comparing APIs.',
      inputSchema: findSimilarApisSchema,
      annotations: { readOnlyHint: true },
    },
    ({ apiUrl, searchDepth, filterByCategory, includeAlternatives }) =>
      docs.findSimilarApis(
        apiUrl,
        searchDepth,
        filterByCategory,
        includeAlternatives,
      ),
  );

  server.registerTool(
    "get_documentation_updates",
    {
      title: "Get Documentation Updates",
      description:
        "Links from Apple's Updates page, each with Apple's one-line summary: the release notes of each OS, Xcode and Safari; each framework's updates page (\"SwiftUI updates\"); and the What's new page of each past WWDC. Returns the links, not the changes; read one with get_apple_doc_content. For WWDC sessions use the WWDC tools.",
      inputSchema: getDocumentationUpdatesSchema,
      annotations: { readOnlyHint: true },
    },
    ({ category, technology, year, searchQuery, includeBeta, limit }) =>
      docs.getDocumentationUpdates(
        category,
        technology,
        year,
        searchQuery,
        includeBeta,
        limit,
      ),
  );

  server.registerTool(
    "get_technology_overviews",
    {
      title: "Get Technology Overviews",
      description:
        "Apple's Technology Overviews guides: its collections, each with Apple's summary, and the articles in each, as one tree in Apple's order. category gives one collection with everything in it; searchQuery gives a flat list of the entries that mention it, each with the collection it is in. Returns links, not the articles; read one with get_apple_doc_content.",
      inputSchema: getTechnologyOverviewsSchema,
      annotations: { readOnlyHint: true },
    },
    ({ category, searchQuery, includeSubcategories, limit }) =>
      docs.getTechnologyOverviews(
        category,
        searchQuery,
        includeSubcategories,
        limit,
      ),
  );

  server.registerTool(
    "get_sample_code",
    {
      title: "Get Sample Code",
      description:
        "Apple's sample-code library: project titles with links and Apple's one-line summaries, grouped by framework; read a project's page, with its Download link, with get_apple_doc_content. framework matches the project's framework in any spelling (\"storekit\", \"Store Kit\"); searchQuery matches titles first, then frameworks, paths and summaries.",
      inputSchema: getSampleCodeSchema,
      annotations: { readOnlyHint: true },
    },
    ({ framework, beta, searchQuery, limit }) =>
      docs.getSampleCode(framework, beta, searchQuery, limit),
  );

  server.registerTool(
    "list_wwdc_videos",
    {
      title: "List WWDC Videos",
      description:
        'WWDC sessions from the data bundled with this server (no network): each one\'s title, its link on developer.apple.com, whether it has a transcript and code, and its topics. year is one year or "all" (list_wwdc_years lists them); topic is a topic ID from browse_wwdc_topics or a word in the title; hasCode keeps the sessions with, or without, code.',
      inputSchema: listWWDCVideosSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ year, topic, hasCode, limit }) =>
      text(await handleListWWDCVideos(year, topic, hasCode, limit)),
  );

  server.registerTool(
    "search_wwdc_content",
    {
      title: "Search WWDC Content",
      description:
        "Full-text search of the bundled WWDC transcripts and code (no network). For each session that matches, most matches first: its title, link and year, and up to 3 matches, each a transcript paragraph or the code lines around the match, with the code example's title and the time it appears. searchIn picks transcripts, code or both; language filters the code.",
      inputSchema: searchWWDCContentSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ query, searchIn, year, language, limit }) =>
      text(
        await handleSearchWWDCContent(query, searchIn, year, language, limit),
      ),
  );

  server.registerTool(
    "get_wwdc_video",
    {
      title: "Get WWDC Video",
      description:
        "One WWDC session from the bundled data, as text (no network): title, year and topics; its links, including the HD and SD .mp4 downloads and the documentation it covers; the full transcript as plain text, without timestamps; every code example with the time it appears; and related sessions. Transcripts run to tens of KB: includeTranscript false leaves it out.",
      inputSchema: getWWDCVideoSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ year, videoId, includeTranscript, includeCode }) =>
      text(
        await handleGetWWDCVideo(year, videoId, includeTranscript, includeCode),
      ),
  );

  server.registerTool(
    "get_wwdc_code_examples",
    {
      title: "Get WWDC Code Examples",
      description:
        'Code examples from the bundled WWDC sessions (no network): each with its title, its session\'s title, link and year, the time it appears, and the code. framework keeps the examples whose code mentions it, so "SwiftUI" matches any code that imports SwiftUI; topic, language and year filter too.',
      inputSchema: getWWDCCodeExamplesSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ framework, topic, year, language, limit }) =>
      text(
        await handleGetWWDCCodeExamples(
          framework,
          topic,
          year,
          language,
          limit,
        ),
      ),
  );

  server.registerTool(
    "browse_wwdc_topics",
    {
      title: "Browse WWDC Topics",
      description:
        "The WWDC topics in the bundled data (no network), each with its ID, link and session count. With topicId, that topic's sessions instead, filtered by year and capped by limit.",
      inputSchema: browseWWDCTopicsSchema,
      annotations: { readOnlyHint: true },
    },
    async ({ topicId, includeVideos, year, limit }) =>
      text(await handleBrowseWWDCTopics(topicId, includeVideos, year, limit)),
  );

  server.registerTool(
    "find_related_wwdc_videos",
    {
      title: "Find Related WWDC Videos",
      description:
        "Sessions related to one WWDC session, from the bundled data (no network): first those Apple lists as related on the session's page, then sessions sharing its topics and, with includeYearRelated, sessions of the same year; each with its year, link, topics and whether it has a transcript and code.",
      inputSchema: findRelatedWWDCVideosSchema,
      annotations: { readOnlyHint: true },
    },
    async ({
      videoId,
      year,
      includeExplicitRelated,
      includeTopicRelated,
      includeYearRelated,
      limit,
    }) =>
      text(
        await handleFindRelatedWWDCVideos(
          videoId,
          year,
          includeExplicitRelated,
          includeTopicRelated,
          includeYearRelated,
          limit,
        ),
      ),
  );

  server.registerTool(
    "list_wwdc_years",
    {
      title: "List WWDC Years",
      description:
        "The WWDC years in the bundled data, each with its session count, plus the total and how many sessions have code and transcripts.",
      annotations: { readOnlyHint: true },
    },
    async () => text(await handleListWWDCYears()),
  );
}
