/**
 * The composition root: the MCP server with its name, version and instructions, and every tool registered on it.
 */
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import pkg from "../package.json";
import { tools } from "./tools/index.ts";

const PACKAGE = z.object({ name: z.string(), version: z.string() }).parse(pkg);

/**
 * The server's instructions, which Claude Code adds to its system prompt cut at 2,048 characters: how to search with
 * these tools, from tests on real needs (README.md, "Finding things")
 */
const SEARCH_GUIDE = `Apple's API docs, Human Interface Guidelines (HIG), App Store Connect Help, sample code and WWDC sessions with their code. Search here before writing or fixing code that calls an Apple framework or Swift. A name, or part of one: search_docs_map first.

1. Code examples: pass get_wwdc_code_examples the type or attribute the code contains as \`framework\` (\`LanguageModelSession\`, \`@Generable\`); a framework name finds about half as many (snippets omit imports). Then read the best session with get_wwdc_video (includeTranscript: false) and the articles and samples search_apple_docs lists.
2. Replacing hand-rolled code: search_apple_docs (type "documentation") for what it does, with the UI framework's name ("SwiftUI haptic feedback"; without it, older UIKit and Foundation APIs lead), then confirm the family with search_framework_symbols and a wildcard (\`*feedback*\`).
3. Bugs: search the failing API's name with what it should do ("NLTagger requestAssets", "SwiftData CloudKit sync requirements") and read the first member or article: its Important notes and tables hold the rules, and a type's page lists its members. For a deprecated call, get_api_relations kind "similar" leads with the replacement Apple names.
4. Design: search with type "design" and the HIG's own noun ("progress indicators"; "paywall" finds Apple In-App Purchase), then read the first result titled with it by its URL, never a guessed one.

Searched wrong, or not there:
- Wrong: 0 results (describe the behavior in Apple's words), a 404 (take URLs and framework IDs such as "foundationmodels" from results), or one fuzzy hit for a guessed name (follow it: "ProgressRing" leads to ProgressView).
- Not there: the word matches only another framework's term ("confetti" is an AVFoundation camera reaction), a wildcard symbol search in the framework finds nothing, and Xcode's DocumentationSearch returns only generic matches; look outside Apple's frameworks.
- An existing API comes first under its exact name. Result counts mean nothing: searches fill about 20 slots.`;

/** The tool list is the same for every caller and changes only with a release: a client may keep it for an hour */
const STATIC_LIST = { ttlMs: 3_600_000, cacheScope: "public" } as const;

export const createServer = (): McpServer => {
  const server = new McpServer(PACKAGE, {
    instructions: SEARCH_GUIDE,
    cacheHints: { "tools/list": STATIC_LIST, "server/discover": STATIC_LIST },
  });
  for (const register of tools) {
    register(server);
  }
  return server;
};
