# Apple Docs MCP - Apple Developer Documentation Model Context Protocol Server

[![npm version](https://badge.fury.io/js/apple-docs-mcp-next.svg)](https://www.npmjs.com/package/apple-docs-mcp-next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Apple Developer Documentation MCP Server - Access Apple's official developer docs, frameworks, APIs, SwiftUI, UIKit, and WWDC videos through Model Context Protocol. Search iOS, macOS, watchOS, tvOS, and visionOS documentation with AI-powered natural language queries. Get instant access to Swift/Objective-C code examples, API references, and technical guides directly in Claude, Cursor, or any MCP-compatible AI assistant.

**English** | [日本語](README.ja.md) | [한국어](README.ko.md) | [简体中文](README.zh-CN.md)

## ✨ Features

- 🔍 **Smart Search**: Intelligent search across Apple Developer Documentation for SwiftUI, UIKit, Foundation, CoreData, ARKit, and more
- 📚 **Complete Documentation Access**: Full access to Apple's JSON API for Swift, Objective-C, and framework documentation
- 🔧 **Framework Index**: Browse hierarchical API structures for iOS, macOS, watchOS, tvOS, visionOS frameworks
- 📋 **Technology Catalog**: Explore Apple technologies including SwiftUI, UIKit, Metal, Core ML, Vision, and ARKit
- 📰 **Documentation Updates**: Track WWDC 2024/2025 announcements, iOS 26, macOS 26, and latest SDK releases
- 🎯 **Technology Overviews**: Comprehensive guides for Swift, SwiftUI, UIKit, and all Apple development platforms
- 💻 **Sample Code Library**: Swift and Objective-C code examples for iOS, macOS, and cross-platform development
- 🎥 **WWDC Video Library**: Search WWDC 2014-2025 sessions with transcripts, Swift/SwiftUI code examples, and resources
- 🔗 **Related APIs Discovery**: Find SwiftUI views, UIKit controllers, and framework-specific API relationships
- 📊 **Platform Compatibility**: iOS 13+, macOS 10.15+, watchOS 6+, tvOS 13+, visionOS compatibility analysis
- ⚡ **High Performance**: Optimized for Xcode, Swift Playgrounds, and AI-powered development environments
- 🔄 **Smart UserAgent Pool**: Intelligent UserAgent rotation system with automatic failure recovery and performance monitoring
- 🌐 **Multi-Platform**: Complete iOS, iPadOS, macOS, watchOS, tvOS, and visionOS documentation support
- 🏷️ **Beta & Status Tracking**: iOS 26 beta APIs, deprecated UIKit methods, new SwiftUI features tracking

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
<summary><strong> Amazon A Developer CLI</strong></summary>

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

[📖 Amazon A Developer CLI MCP docs](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/qdev-mcp.html)

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

**Direct Usage**:

```bash
bunx apple-docs-mcp-next --help
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
"List all Beta frameworks in iOS 26"
"Show me Graphics & Games technologies"
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
"Show featured WWDC sample code"
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
"Get details for WWDC session 10176"
"Show me the transcript for WWDC23 session on SwiftData"
"Get code examples from WWDC video 10019"
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

| Tool | Description | Key Features |
| ------ | ------------- | -------------- |
| `search_apple_docs` | Search Apple Developer Documentation | Official search API, find specific APIs, classes, methods |
| `get_apple_doc_content` | Get detailed documentation content | JSON API access, optional enhanced analysis (related/similar APIs, platform compatibility) |
| `list_technologies` | Browse all Apple technologies | Category filtering, language support, beta status |
| `search_framework_symbols` | Search symbols in specific framework | Classes, structs, protocols, wildcard patterns, type filtering |
| `get_related_apis` | Find related APIs | Inheritance, conformance, "See Also" relationships |
| `resolve_references_batch` | Batch resolve API references | Extract and resolve all references from documentation |
| `get_platform_compatibility` | Platform compatibility analysis | Version support, beta status, deprecation info |
| `find_similar_apis` | Discover similar APIs | Apple's official recommendations, topic groupings |
| `get_documentation_updates` | Track Apple documentation updates | WWDC announcements, technology updates, release notes |
| `get_technology_overviews` | Get technology overviews and guides | Comprehensive guides, hierarchical navigation, platform filtering |
| `get_sample_code` | Browse Apple sample code projects | Framework filtering (with limitations), keyword search, beta status |
| `search_wwdc_videos` | Search WWDC video sessions | Keyword search, topic/year filtering, session metadata |
| `get_wwdc_video_details` | Get WWDC video details with transcript | Full transcripts, code examples, resources, platform info |
| `list_wwdc_topics` | List all available WWDC topics | 19 topic categories from Swift to Spatial Computing |
| `list_wwdc_years` | List all available WWDC years | Conference years with video counts |

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

### 🚀 Performance Features

- **Memory-Based Caching**: Custom cache implementation with automatic cleanup and TTL support
- **Smart UserAgent Pool**: Intelligent rotation system with automatic failure recovery and performance monitoring
- **Dynamic Headers**: Realistic browser headers generation (Accept, Accept-Language, User-Agent)
- **Smart Search**: Official Apple search API with enhanced result formatting
- **Enhanced Analysis**: Optional related APIs, platform compatibility, and similarity analysis
- **Error Resilience**: Graceful degradation with comprehensive error handling
- **Type Safety**: Full TypeScript with Zod v4.0.5 runtime validation
- **Latest Dependencies**: MCP SDK v1.15.1, optimized package footprint

### 💾 Caching Strategy

| Content Type | Cache Duration | Cache Size | Reason |
| -------------- | ---------------- | ------------ | -------- |
| API Documentation | 30 minutes | 500 entries | Frequently accessed, moderate updates |
| Search Results | 10 minutes | 200 entries | Dynamic content, user-specific |
| Framework Indexes | 1 hour | 100 entries | Stable structure, less frequent changes |
| Technologies List | 2 hours | 50 entries | Rarely changes, large content |
| Documentation Updates | 30 minutes | 100 entries | Regular updates, WWDC announcements |

## 📦 WWDC Data

All WWDC video data (2014-2025) is **bundled directly in the npm package**, providing:

- ✅ **Zero network latency** - No API calls needed for WWDC content
- ✅ **100% offline access** - Works without internet connection
- ✅ **No rate limits** - Unlimited WWDC searches and browsing
- ✅ **Instant responses** - All data is locally available

The package includes:

- 📹 **1,260+ WWDC session videos** with full transcripts
- 🏷️ **20 topic categories** for organized browsing
- 📅 **13 years of content** (2012-2025)
- 💾 **35MB of optimized JSON data**

> **Note**: Keep your package updated to get the latest WWDC content additions.

## ⚙️ Configuration

### 🔄 UserAgent Pool Configuration

The MCP server includes an intelligent UserAgent rotation system to improve API reliability:

#### Environment Variables

| Variable | Description | Default | Example |
| ---------- | ------------- | --------- | --------- |
| `USER_AGENT_ROTATION_ENABLED` | Enable/disable rotation | `true` | `true` |
| `USER_AGENT_POOL_STRATEGY` | Rotation strategy | `random` | `smart` |
| `USER_AGENT_MAX_RETRIES` | Max retry attempts | `3` | `5` |
| `USER_AGENT_POOL_CONFIG` | Custom pool config (JSON) | Built-in agents | See below |

#### Custom Pool Configuration

```bash
# Configure custom UserAgent pool
export USER_AGENT_POOL_CONFIG='[
  {"userAgent": "MyApp/1.0 (compatible)", "weight": 3, "maxUsageCount": 1000},
  {"userAgent": "MyApp/2.0 (advanced)", "weight": 2, "maxUsageCount": 800}
]'

# Set rotation strategy (random/sequential/smart)
export USER_AGENT_POOL_STRATEGY=smart

# Enable debugging
export NODE_ENV=development
```

#### Available Strategies

- **`random`**: Fast random selection (best performance)
- **`sequential`**: Round-robin rotation (predictable order)
- **`smart`**: Success rate optimization (best reliability)

#### Built-in UserAgents

The server includes 12+ pre-configured UserAgent strings covering:

- Chrome (Mac Intel/Apple Silicon, Windows, Linux)
- Firefox (Mac Intel/Apple Silicon, Windows, Linux)
- Safari (Mac Intel/Apple Silicon, latest versions)
- Edge (Windows, Mac Intel/Apple Silicon)

## 🧪 Development

### Quick Commands

```bash
# Development with auto-reload
bun run dev


# Type checking
bun check

```

### Testing Locally

```bash
# Test the MCP server directly
bun run start

# Test with sample queries
bunx apple-docs-mcp-next --test
```

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

[Report Issues](https://github.com/kimsungwhee/apple-docs-mcp/issues) • [Request Features](https://github.com/kimsungwhee/apple-docs-mcp/issues/new) • [Documentation](https://github.com/kimsungwhee/apple-docs-mcp)

</div>
