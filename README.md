# Apple Docs MCP - Apple Developer Documentation Model Context Protocol Server

[![npm version](https://badge.fury.io/js/apple-docs-mcp-next.svg)](https://www.npmjs.com/package/apple-docs-mcp-next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Apple Developer Documentation MCP Server - Access Apple's official developer docs, frameworks, APIs, SwiftUI, UIKit, and WWDC videos through Model Context Protocol. Search iOS, macOS, watchOS, tvOS, and visionOS documentation with AI-powered natural language queries. Get instant access to Swift/Objective-C code examples, API references, and technical guides directly in Claude, Cursor, or any MCP-compatible AI assistant.

**English** | [日本語](README.ja.md) | [한국어](README.ko.md) | [简体中文](README.zh-CN.md)

## ✨ Features

- 🔍 **Search**: developer.apple.com's own search across the API reference, the Human Interface Guidelines, sample code, App Store Connect Help and WWDC sessions
- 📚 **Documentation pages**: any page as Markdown, from the JSON the website renders it from: declarations, overviews, code listings, Topics, relationships, availability and See Also
- 🗺️ **Docs map**: every page title of the documentation and the HIG on disk, searched without the network
- 🔧 **Framework symbols**: the symbols of one framework from its navigator index, filtered by kind and by a wildcard name
- 📋 **Technology catalog**: Apple's technology index with its categories, languages and beta flags
- 📰 **Documentation updates**: the release notes, each framework's updates page and each WWDC's What's new page
- 🎯 **Technology overviews**: Apple's Technology Overviews guides as one tree
- 💻 **Sample code**: Apple's sample-code library, by framework and keyword
- 🔗 **Related, referenced and similar APIs**: read from a page's JSON, with Apple's replacements first for a deprecated API
- 📊 **Platform availability**: the version each platform introduced or deprecated an API in
- 🎥 **WWDC library**: 1,700 sessions from 2014 to 2026, bundled with the server, with transcripts and code examples

## 🚀 Quick Start

### Claude Desktop (Recommended)

Add this to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "apple-docs": {
      "command": "bunx",
      "args": ["apple-docs-mcp-next"]
    }
  }
}
```

> **Note**: If you encounter issues with an old version being used, add `@latest` to force the latest version:
>
> ```json
> "args": ["apple-docs-mcp-next@latest"]
> ```

Restart Claude Desktop and start asking about Apple APIs!

## 📦 Installation

<details>
<summary><strong>📱 Claude Code</strong></summary>

```bash
claude mcp add apple-docs -- bunx apple-docs-mcp-next@latest
```

**From source**: `bunx` downloads the package from npm, so it fails with a 404 for a fork or a version that is not on npm.
Run the server from a clone instead:

```bash
git clone https://github.com/xsyetopz/apple-docs-mcp-next.git
cd apple-docs-mcp-next
bun install
claude mcp add --scope user apple-docs -- bun run "$PWD/src/main.ts"
```

Claude Code starts the server from the folder of the current project, so the path must be absolute. `"$PWD"` gives the absolute path of the clone.

[📖 Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp)

</details>

<details>
<summary><strong>🖱️ Cursor</strong></summary>

**Via Settings**: Settings → Cursor Settings → MCP → Add new global MCP server

**Via Config File**: Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "apple-docs": {
      "command": "bunx",
      "args": ["apple-docs-mcp-next"]
    }
  }
}
```

[📖 Cursor MCP docs](https://docs.cursor.com/context/mcp)

</details>

<details>
<summary><strong>🔷 VS Code</strong></summary>

Add to your VS Code MCP config:

```json
{
  "mcp": {
    "servers": {
      "apple-docs": {
        "type": "stdio",
        "command": "bunx",
        "args": ["apple-docs-mcp-next"]
      }
    }
  }
}
```

[📖 VS Code MCP docs](https://code.visualstudio.com/docs/editor/mcp)

</details>

<details>
<summary><strong>🌊 Windsurf</strong></summary>

Add to your Windsurf MCP config:

```json
{
  "mcpServers": {
    "apple-docs": {
      "command": "bunx",
      "args": ["apple-docs-mcp-next"]
    }
  }
}
```

[📖 Windsurf MCP docs](https://docs.codeium.com/windsurf/mcp)

</details>

<details>
<summary><strong>⚡ Zed</strong></summary>

Add to your Zed `settings.json`:

```json
{
  "context_servers": {
    "Apple Docs": {
      "command": {
        "path": "bunx",
        "args": ["apple-docs-mcp-next"]
      },
      "settings": {}
    }
  }
}
```

[📖 Zed Context Server docs](https://zed.dev/docs/context-servers)

</details>

<details>
<summary><strong>🔧 Cline</strong></summary>

**Via Marketplace**:

1. Open Cline → Menu (☰) → MCP Servers → Marketplace
2. Search "Apple Docs MCP" → Install

**Via Config**: Add to `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "apple-docs": {
      "command": "bunx",
      "args": ["apple-docs-mcp-next"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

</details>

<details>
<summary><strong>🟠 Amazon Q Developer CLI</strong></summary>

**Via Config File**: Add to `~/.aws/amazonq/mcp.json`:

```json
{
  "mcpServers": {
    "apple-docs": {
      "command": "bunx",
      "args": ["apple-docs-mcp-next"]
    }
  }
}
```

[📖 Amazon Q Developer CLI MCP docs](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/qdev-mcp.html)

</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

For Windows systems, use:

```json
{
  "mcpServers": {
    "apple-docs": {
      "command": "cmd",
      "args": ["/c", "bunx", "apple-docs-mcp-next"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

</details>

<details>
<summary><strong>⚙️ Advanced Installation</strong></summary>

**Global Installation**:

```bash
bun add -g apple-docs-mcp-next
```

**Direct Usage** (the server speaks MCP on stdin and stdout):

```bash
bunx apple-docs-mcp-next
```

**Development Setup**:

```bash
git clone https://github.com/xsyetopz/apple-docs-mcp-next.git
cd apple-docs-mcp-next

bun install
```

</details>

## 💬 Usage Examples

### 🔍 Smart Search

```text
"Search for SwiftUI animations"
"Find withAnimation API documentation"
"Look up async/await patterns in Swift"
"Show me UITableView delegate methods"
"Search Core Data NSPersistentContainer examples"
"Find AVFoundation video playback APIs"
```

### 📚 Documentation Access

```text
"Get detailed information about the SwiftUI framework"
"Show me withAnimation API with related APIs"
"Get platform compatibility for SwiftData"
"Access UIViewController documentation with similar APIs"
"Show me NSManagedObjectContext documentation"
"Get URLSession async/await methods"
```

### 🔧 Framework Exploration

```text
"Show me SwiftUI framework API index"
"List all UIKit classes and methods"
"Browse ARKit framework structure"
"Get WeatherKit API hierarchy"
"Explore Core ML model loading APIs"
"Show Vision framework image analysis APIs"
```

### 🔗 API Discovery

```text
"Find APIs related to UIViewController"
"Show me similar APIs to withAnimation"
"Get all references from SwiftData documentation"
"Discover alternatives to Core Data NSManagedObject"
```

### 📋 Technology & Platform Analysis

```text
"List the technologies that are in beta"
"Show me Graphics and Games technologies"
"What machine learning frameworks are available?"
"Analyze platform compatibility for Vision framework"
```

### 📰 Documentation Updates

```text
"Show me the latest WWDC updates"
"What's new in SwiftUI?"
"Get technology updates for iOS"
"Show me release notes for Xcode"
"Find beta features in the latest updates"
```

### 🎯 Technology Overviews

```text
"Show me technology overviews for app design and UI"
"Get comprehensive guides for games development"
"Explore AI and machine learning overviews"
"Show me iOS-specific technology guides"
"Get data management technology overviews"
```

### 💻 Sample Code Library

```text
"Show SwiftUI sample code projects"
"Find sample code for machine learning"
"Get UIKit example projects"
"Show featured SwiftUI sample code"
"Find Core Data sample implementations"
"Show only beta sample code projects"
```

### 🎥 WWDC Video Search

```text
"Search WWDC videos about SwiftUI"
"Find WWDC sessions on machine learning"
"Show me WWDC 2024 videos"
"Search for async/await WWDC talks"
"Find WWDC videos about Swift concurrency"
"Show accessibility-focused WWDC sessions"
```

### 📺 WWDC Video Details

```text
"Get details for WWDC23 session 10176"
"Show me the transcript for WWDC23 session on SwiftData"
"Get code examples from WWDC20 session 10019"
"Show resources from Vision Pro WWDC session"
"Get transcript for 'Meet async/await in Swift' session"
```

### 📋 WWDC Topics & Years

```text
"List all WWDC topics"
"Show me Swift topic WWDC videos"
"Get WWDC videos about developer tools"
"List WWDC videos from 2023"
"Show all SwiftUI and UI frameworks sessions"
"Get machine learning WWDC content"
```

### 🛠️ Advanced Usage

```text
"Find related APIs for @State with platform analysis"
"Resolve all references from SwiftUI documentation"
"Get platform compatibility analysis for Vision framework"
"Find similar APIs to UIViewController with deep search"
```

## 🛠️ Available Tools

| Tool | What it returns |
| ------ | ----------------- |
| `search_apple_docs` | Search results from developer.apple.com: documentation, HIG, sample code, App Store Connect Help and WWDC sessions |
| `get_apple_doc_content` | One documentation page as Markdown, optionally with related, referenced and similar APIs and a platform analysis |
| `search_docs_map` | Pages whose title contains a query, from the docs map on disk (no network) |
| `list_technologies` | Apple's technology index, by category, language and beta status |
| `search_framework_symbols` | The symbols of one framework, by kind and wildcard name |
| `get_related_apis` | Inheritance, conformances, See Also and Topics of one page |
| `resolve_references_batch` | The pages one page references, with their summaries and declarations |
| `get_platform_compatibility` | Where an API is available, introduced and deprecated |
| `find_similar_apis` | Alternatives to an API, Apple's replacements first for a deprecated one |
| `get_documentation_updates` | Release notes, framework updates pages and WWDC What's new pages |
| `get_technology_overviews` | Apple's Technology Overviews guides |
| `get_sample_code` | Apple's sample-code projects, by framework and keyword |
| `list_wwdc_videos` | WWDC sessions by year, topic and code |
| `search_wwdc_content` | Full-text search of WWDC transcripts and code |
| `get_wwdc_video` | One session: links, transcript, code examples and related sessions |
| `get_wwdc_code_examples` | WWDC code examples by the type or framework they use |
| `browse_wwdc_topics` | The 19 WWDC topics, or one topic's sessions |
| `find_related_wwdc_videos` | Sessions related to one session |
| `list_wwdc_years` | The WWDC years with their session counts |

Every tool is read-only. A failed call returns one error result with what to try instead.

## 🏗️ Technical Architecture for Apple Developer Documentation Access

```text
apple-docs-mcp-next/
├── 🔧 src/
│   ├── main.ts                       # Executable: the server on stdio
│   ├── server.ts                     # Composition root: the MCP server and its instructions
│   ├── tools/                        # MCP side: one spec per tool (name, description, zod input schema, use case)
│   │   ├── define-tool.ts            # Registers a spec; Markdown or one error result per call
│   │   └── index.ts                  # Every tool the server offers
│   ├── docs/                         # Use cases for Apple's documentation, HIG, sample code and help pages
│   ├── wwdc/                         # Use cases for the bundled WWDC data, and its extractors
│   ├── core/                         # HTTP client, caches, errors, logger, constants
│   └── types/                        # DocC and captured response types (generated)
├── 🧪 tests/                         # Bun tests, by layer, plus tests/architecture.test.ts for the import rules
├── 📄 package.json                   # Package configuration
└── 📖 README.md                      # This file
```

### 🚀 Requests and Caching

- **Caches**: in-memory LRU caches with a time to live, one per kind of answer (below); search results are not cached
- **Browser headers**: each request to Apple carries a fresh set of Safari headers from `header-generator`
- **Retries**: network errors, timeouts and 5xx answers retry 3 times with exponential backoff; other statuses fail at once
- **Pacing**: at most 100 requests a minute, and searches 15 s apart, as Apple answers quicker ones with no results
- **Validation**: every tool's arguments are checked against its Zod 4 schema before the tool runs
- **Runtime**: Bun 1.4.3 and the MCP TypeScript SDK 1.32.1

### 💾 Caching Strategy

| Content Type | Cache Duration | Cache Size |
| -------------- | ---------------- | ------------ |
| Documentation pages | 30 minutes | 500 entries |
| Framework indexes | 1 hour | 100 entries |
| Technologies list | 2 hours | 50 entries |
| Documentation updates | 30 minutes | 100 entries |
| Sample code | 2 hours | 100 entries |
| Technology overviews | 2 hours | 100 entries |
| WWDC data files | 1 hour | 100 entries |

## 📦 WWDC Data

The WWDC data is **bundled with the package** in `data/wwdc/`, so the WWDC tools need no network:

- 📹 **1,700 sessions** from WWDC 2014 to WWDC 2026
- 📝 **1,416 transcripts** and **715 sessions with code examples**
- 🏷️ **19 topics** for browsing
- 💾 **41 MB** of JSON

`bun scripts/add-wwdc-year.ts <year>` adds a WWDC year to the data, or refreshes it.

## ⚙️ Configuration

| Variable | Effect | Default |
| ---------- | -------- | --------- |
| `MCP_DEBUG` | `true` adds debug and info lines to the log | off |

The server logs to stderr only: on the stdio transport, stdout carries the MCP messages.

## 🧪 Development

```bash
bun install

bun run dev        # the server, restarted on each change
bun run start      # the server on stdio
bun check          # type check
bun run lint       # Biome
bun run test       # the tests, each file in isolation
bun run ci         # type check, Biome, markdownlint and the tests, as CI runs them
```

`tests/architecture.test.ts` checks the layers of `src/`: imports point from `main` to `server`, `tools`, the use cases in `docs` and `wwdc`, and `core`, never back.

`bun scripts/build-docs-map.ts api-map/apple-docs-map.tsv` rebuilds the docs map that `search_docs_map` reads.

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## ⚠️ Disclaimer

This project is not affiliated with or endorsed by Apple Inc. It uses publicly available Apple Developer Documentation APIs for educational and development purposes.

---

<div align="center">

<p><strong>Made with ❤️ for the Apple Developer Community</strong></p>

Search Apple Developer Documentation | iOS Development | macOS Development | Swift Programming | SwiftUI | UIKit | Xcode | WWDC Videos | Model Context Protocol | MCP Server

[Report Issues](https://github.com/xsyetopz/apple-docs-mcp-next/issues) • [Request Features](https://github.com/xsyetopz/apple-docs-mcp-next/issues/new) • [Documentation](https://github.com/xsyetopz/apple-docs-mcp-next#readme)

</div>
