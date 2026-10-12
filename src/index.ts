#!/usr/bin/env bun

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import pkg from "../package.json";
import { fetchAppleDocJson } from "./tools/doc-fetcher.ts";
import { handleFindSimilarApis } from "./tools/find-similar-apis.ts";
import { handleGetDocumentationUpdates } from "./tools/get-documentation-updates.ts";
import { handleGetPlatformCompatibility } from "./tools/get-platform-compatibility.ts";
import { handleGetRelatedApis } from "./tools/get-related-apis.ts";
import { handleGetSampleCode } from "./tools/get-sample-code.ts";
import { handleGetTechnologyOverviews } from "./tools/get-technology-overviews.ts";
import { registerTools } from "./tools/handlers.ts";
import { handleListTechnologies } from "./tools/list-technologies.ts";
import { handleResolveReferencesBatch } from "./tools/resolve-references-batch.ts";
import { searchStreams } from "./tools/search-api.ts";
import { searchFrameworkSymbols } from "./tools/search-framework-symbols.ts";
import { parseSearchResults } from "./tools/search-parser.ts";
import { API_LIMITS, APPLE_URLS } from "./utils/constants.ts";
import {
  createErrorResponse,
  createStandardErrorResponse,
  ErrorType,
  isAppError,
  validateInput,
} from "./utils/error-handler.ts";
import { logger } from "./utils/logger.ts";
import { isValidAppleDeveloperUrl } from "./utils/url-converter.ts";

const PACKAGE = z.object({ name: z.string(), version: z.string() }).parse(pkg);

/**
 * The server's instructions, which Claude Code adds to its system prompt cut at 2,048 characters: how to search with
 * these tools, from tests on real needs (README.md, "Finding things")
 */
const SEARCH_GUIDE = `Apple's API docs, Human Interface Guidelines (HIG), App Store Connect Help, sample code and WWDC sessions with their code. Search here before writing or fixing code that calls an Apple framework or Swift. A name, or part of one: search_docs_map first.

1. Code examples: pass get_wwdc_code_examples the type or attribute the code contains as \`framework\` (\`LanguageModelSession\`, \`@Generable\`); a framework name finds about half as many (snippets omit imports). Then read the best session with get_wwdc_video (includeTranscript: false) and the articles and samples search_apple_docs lists.
2. Replacing hand-rolled code: search_apple_docs (type "documentation") for what it does, with the UI framework's name ("SwiftUI haptic feedback"; without it, older UIKit and Foundation APIs lead), then confirm the family with search_framework_symbols and a wildcard (\`*feedback*\`).
3. Bugs: search the failing API's name with what it should do ("NLTagger requestAssets", "SwiftData CloudKit sync requirements") and read the first member or article: its Important notes and tables hold the rules, and a type's page lists its members. For a deprecated call, find_similar_apis leads with the replacement Apple names.
4. Design: search with type "design" and the HIG's own noun ("progress indicators"; "paywall" finds Apple In-App Purchase), then read the first result titled with it by its URL, never a guessed one.

Searched wrong, or not there:
- Wrong: 0 results (describe the behavior in Apple's words), a 404 (take URLs and framework IDs such as "foundationmodels" from results), or one fuzzy hit for a guessed name (follow it: "ProgressRing" leads to ProgressView).
- Not there: the word matches only another framework's term ("confetti" is an AVFoundation camera reaction), a wildcard symbol search in the framework finds nothing, and Xcode's DocumentationSearch returns only generic matches; look outside Apple's frameworks.
- An existing API comes first under its exact name. Result counts mean nothing: searches fill about 20 slots.`;

export default class AppleDeveloperDocsMCPServer {
  private server: McpServer;

  /**
   * Helper method to handle async operations with consistent error handling
   */
  private async handleAsyncOperation(
    operation: () => Promise<string>,
    operationName: string,
  ): Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  }> {
    try {
      const result = await operation();
      return {
        content: [
          {
            type: "text" as const,
            text: result,
          },
        ],
      };
    } catch (error) {
      if (isAppError(error)) {
        return createErrorResponse(error);
      }
      return createStandardErrorResponse(error, operationName);
    }
  }

  constructor() {
    this.server = new McpServer(PACKAGE, { instructions: SEARCH_GUIDE });
    registerTools(this.server, this);
    this.setupErrorHandling();
  }

  public async searchAppleDocs(query: string, type: string = "all") {
    try {
      // 输入验证
      const queryValidation = validateInput(query, "Search query");
      if (queryValidation) {
        return createErrorResponse(queryValidation);
      }

      // 创建 Apple Developer Documentation 搜索 URL
      const searchUrl = `${APPLE_URLS.SEARCH}?q=${encodeURIComponent(query)}`;

      logger.info(`Searching Apple docs for: ${query}`);

      const streams = await searchStreams(query, type);

      // 解析并返回搜索结果，传递type参数进行过滤
      return parseSearchResults(streams, query, searchUrl, type);
    } catch (error) {
      if (isAppError(error)) {
        return createErrorResponse(error);
      }
      return createStandardErrorResponse(error, "search_apple_docs");
    }
  }

  public async getAppleDocContent(
    url: string,
    includeRelatedApis: boolean = false,
    includeReferences: boolean = false,
    includeSimilarApis: boolean = false,
    includePlatformAnalysis: boolean = false,
  ) {
    try {
      // 输入验证
      const urlValidation = validateInput(url, "URL");
      if (urlValidation) {
        return createErrorResponse(urlValidation);
      }

      // 验证是否为有效的Apple Developer URL
      if (!isValidAppleDeveloperUrl(url)) {
        return createErrorResponse({
          type: ErrorType.INVALID_INPUT,
          message: "URL must be from developer.apple.com",
        });
      }

      // fetchAppleDocJson 已经返回正确的MCP响应格式，直接返回
      return await fetchAppleDocJson(url, {
        includeRelatedApis,
        includeReferences,
        includeSimilarApis,
        includePlatformAnalysis,
      });
    } catch (error) {
      if (isAppError(error)) {
        return createErrorResponse(error);
      }
      return createStandardErrorResponse(error, "get_apple_doc_content");
    }
  }

  public async listTechnologies(
    category?: string,
    language?: string,
    includeBeta: boolean = true,
    limit: number = API_LIMITS.DEFAULT_TECHNOLOGIES_LIMIT,
  ) {
    return this.handleAsyncOperation(
      () => handleListTechnologies(category, language, includeBeta, limit),
      "listTechnologies",
    );
  }

  public async searchFrameworkSymbols(
    framework: string,
    symbolType: string = "all",
    namePattern?: string,
    language: string = "swift",
    limit: number = API_LIMITS.DEFAULT_FRAMEWORK_SYMBOLS_LIMIT,
  ) {
    return this.handleAsyncOperation(
      () =>
        searchFrameworkSymbols(
          framework,
          symbolType,
          namePattern,
          language,
          limit,
        ),
      "searchFrameworkSymbols",
    );
  }

  public async getRelatedApis(
    apiUrl: string,
    includeInherited: boolean = true,
    includeConformance: boolean = true,
    includeSeeAlso: boolean = true,
  ) {
    return this.handleAsyncOperation(
      () =>
        handleGetRelatedApis(
          apiUrl,
          includeInherited,
          includeConformance,
          includeSeeAlso,
        ),
      "getRelatedApis",
    );
  }

  public async resolveReferencesBatch(
    sourceUrl: string,
    maxReferences: number = API_LIMITS.DEFAULT_REFERENCES_LIMIT,
    filterByType: string = "all",
  ) {
    return this.handleAsyncOperation(
      () =>
        handleResolveReferencesBatch(sourceUrl, maxReferences, filterByType),
      "resolveReferencesBatch",
    );
  }

  public async getPlatformCompatibility(
    apiUrl: string,
    compareMode: string = "single",
    includeRelated: boolean = false,
  ) {
    return this.handleAsyncOperation(
      () => handleGetPlatformCompatibility(apiUrl, compareMode, includeRelated),
      "getPlatformCompatibility",
    );
  }

  public async findSimilarApis(
    apiUrl: string,
    searchDepth: string = "medium",
    filterByCategory?: string,
    includeAlternatives: boolean = true,
  ) {
    return this.handleAsyncOperation(
      () =>
        handleFindSimilarApis(
          apiUrl,
          searchDepth,
          filterByCategory,
          includeAlternatives,
        ),
      "findSimilarApis",
    );
  }

  public async getDocumentationUpdates(
    category: string = "all",
    technology?: string,
    year?: string,
    searchQuery?: string,
    includeBeta: boolean = true,
    limit: number = API_LIMITS.DEFAULT_DOCUMENTATION_UPDATES_LIMIT,
  ) {
    return this.handleAsyncOperation(
      () =>
        handleGetDocumentationUpdates(
          category,
          technology,
          year,
          searchQuery,
          includeBeta,
          limit,
        ),
      "getDocumentationUpdates",
    );
  }

  public async getTechnologyOverviews(
    category?: string,
    searchQuery?: string,
    includeSubcategories: boolean = true,
    limit: number = API_LIMITS.DEFAULT_TECHNOLOGY_OVERVIEWS_LIMIT,
  ) {
    return this.handleAsyncOperation(
      () =>
        handleGetTechnologyOverviews(
          category,
          searchQuery,
          includeSubcategories,
          limit,
        ),
      "getTechnologyOverviews",
    );
  }

  public async getSampleCode(
    framework?: string,
    beta: "include" | "exclude" | "only" = "include",
    searchQuery?: string,
    limit: number = API_LIMITS.DEFAULT_SAMPLE_CODE_LIMIT,
  ) {
    return this.handleAsyncOperation(
      () => handleGetSampleCode(framework, beta, searchQuery, limit),
      "getSampleCode",
    );
  }

  private setupErrorHandling() {
    // 处理 SIGINT 以优雅关闭服务器
    process.on("SIGINT", () => {
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      process.exit(0);
    });

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection, reason:", reason);
      process.exit(1);
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      process.exit(1);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info("Apple Developer Docs MCP server running on stdio");
    logger.info("WWDC Data: Using bundled data from npm package");
    logger.info(
      "Cache system initialized with TTL: API(30m), Index(1h), Technologies(2h)",
    );
    logger.info(
      "Note: Search results are not cached to ensure real-time accuracy",
    );
  }
}

// Run server (only in non-test environment)
if (process.env.NODE_ENV !== "test") {
  const server = new AppleDeveloperDocsMCPServer();
  void server.run().catch((error) => {
    logger.error("Fatal error in main():", error);
    process.exit(1);
  });
}
