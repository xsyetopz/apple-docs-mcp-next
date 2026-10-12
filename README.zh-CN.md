# Apple Docs MCP - Apple 开发者文档模型上下文协议服务器

[![npm 版本](https://badge.fury.io/js/apple-docs-mcp-next.svg)](https://www.npmjs.com/package/apple-docs-mcp-next)
[![许可证: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Apple 开发者文档 MCP 服务器 - 通过模型上下文协议访问 Apple 官方开发文档、框架、API、SwiftUI、UIKit 和 WWDC 视频。使用 AI 自然语言查询搜索 iOS、macOS、watchOS、tvOS 和 visionOS 文档。在 Claude、Cursor 或任何兼容 MCP 的 AI 助手中即时获取 Swift/Objective-C 代码示例、API 参考和技术指南。

[English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | **简体中文**

## ✨ 功能特性

- 🔍 **搜索**: developer.apple.com 自身的搜索，覆盖 API 参考、人机界面指南（HIG）、示例代码、App Store Connect 帮助和 WWDC 会议
- 📚 **文档页面**: 任一页面以 Markdown 形式呈现，数据来自网站渲染所用的 JSON：声明、概述、代码清单、Topics、关系、可用性和 See Also
- 🗺️ **文档地图**: 磁盘上文档和 HIG 的每个页面标题，无需网络即可搜索
- 🔧 **框架符号**: 从框架的导航索引中获取单个框架的符号，可按类型和通配符名称过滤
- 📋 **技术目录**: Apple 技术索引，包含其类别、语言和 beta 标记
- 📰 **文档更新**: 发布说明、每个框架的更新页面以及每届 WWDC 的 “What's new” 页面
- 🎯 **技术概览**: 以一棵树的形式呈现 Apple 的技术概览指南
- 💻 **示例代码**: Apple 的示例代码库，可按框架和关键词查找
- 🔗 **相关、引用和类似 API**: 从页面的 JSON 读取；对于已弃用的 API，优先显示 Apple 推荐的替代项
- 📊 **平台可用性**: 每个平台引入或弃用某 API 的版本
- 🎥 **WWDC 视频库**: 2014 至 2026 年的 1,700 场会议，随服务器一起打包，包含文字记录和代码示例

## 🚀 快速开始

### Claude Desktop（推荐）

将此配置添加到您的 Claude Desktop 配置文件中：

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

> **注意**: 如果遇到使用旧版本的问题，添加 `@latest` 以强制使用最新版本：
>
> ```json
> "args": ["apple-docs-mcp-next@latest"]
> ```

重启 Claude Desktop 并开始询问 Apple API！

## 📦 安装指南

<details>
<summary><strong>📱 Claude Code</strong></summary>

```bash
claude mcp add apple-docs -- bunx apple-docs-mcp-next@latest
```

[📖 Claude Code MCP 文档](https://docs.anthropic.com/en/docs/claude-code/mcp)

</details>

<details>
<summary><strong>🖱️ Cursor</strong></summary>

**通过设置**: 设置 → Cursor 设置 → MCP → 添加新的全局 MCP 服务器

**通过配置文件**: 添加到 `~/.cursor/mcp.json`:

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

[📖 Cursor MCP 文档](https://docs.cursor.com/context/mcp)

</details>

<details>
<summary><strong>🔷 VS Code</strong></summary>

添加到您的 VS Code MCP 配置：

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

[📖 VS Code MCP 文档](https://code.visualstudio.com/docs/editor/mcp)

</details>

<details>
<summary><strong>🌊 Windsurf</strong></summary>

添加到您的 Windsurf MCP 配置：

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

[📖 Windsurf MCP 文档](https://docs.codeium.com/windsurf/mcp)

</details>

<details>
<summary><strong>⚡ Zed</strong></summary>

添加到您的 Zed `settings.json`:

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

[📖 Zed 上下文服务器文档](https://zed.dev/docs/context-servers)

</details>

<details>
<summary><strong>🔧 Cline</strong></summary>

**通过市场**:

1. 打开 Cline → 菜单 (☰) → MCP 服务器 → 市场
2. 搜索 "Apple Docs MCP" → 安装

**通过配置**: 添加到 `cline_mcp_settings.json`:

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

**通过配置文件**: 添加到 `~/.aws/amazonq/mcp.json`:

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

[📖 Amazon Q Developer CLI MCP 文档](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/qdev-mcp.html)

</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

对于 Windows 系统，使用：

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
<summary><strong>⚙️ 高级安装</strong></summary>

**全局安装**:

```bash
bun add -g apple-docs-mcp-next
```

**直接使用**（服务器通过 stdin 和 stdout 收发 MCP 消息）:

```bash
bunx apple-docs-mcp-next
```

**开发环境设置**:

```bash
git clone https://github.com/xsyetopz/apple-docs-mcp-next.git
cd apple-docs-mcp-next

bun install
```

</details>

## 💬 使用示例

### 🔍 智能搜索

```text
"搜索 SwiftUI 动画"
"查找 withAnimation API 文档"
"查询 Swift 中的 async/await 模式"
"显示 UITableView 委托方法"
"搜索 Core Data NSPersistentContainer 示例"
"查找 AVFoundation 视频播放 API"
```

### 📚 文档访问

```text
"获取 SwiftUI 框架的详细信息"
"显示 withAnimation API 及相关 API"
"获取 SwiftData 的平台兼容性"
"访问 UIViewController 文档及类似 API"
"显示 NSManagedObjectContext 文档"
"获取 URLSession async/await 方法"
```

### 🔧 框架探索

```text
"显示 SwiftUI 框架 API 索引"
"列出所有 UIKit 类和方法"
"浏览 ARKit 框架结构"
"获取 WeatherKit API 层次结构"
"探索 Core ML 模型加载 API"
"显示 Vision 框架图像分析 API"
```

### 🔗 API 发现

```text
"查找与 UIViewController 相关的 API"
"显示与 withAnimation 类似的 API"
"获取 SwiftData 文档中的所有引用"
"发现 Core Data NSManagedObject 的替代方案"
```

### 📋 技术和平台分析

```text
"列出处于 beta 阶段的技术"
"显示 Graphics and Games 技术"
"有哪些机器学习框架可用？"
"分析 Vision 框架的平台兼容性"
```

### 📰 文档更新

```text
"显示最新的 WWDC 更新"
"SwiftUI 有什么新变化？"
"获取 iOS 的技术更新"
"显示 Xcode 的发布说明"
"查找最新更新中的 beta 功能"
```

### 🎯 技术概览

```text
"显示应用设计和 UI 的技术概览"
"获取游戏开发的综合指南"
"探索 AI 和机器学习概览"
"显示 iOS 专属的技术指南"
"获取数据管理技术概览"
```

### 💻 示例代码库

```text
"显示 SwiftUI 示例代码项目"
"查找机器学习的示例代码"
"获取 UIKit 示例项目"
"显示精选的 SwiftUI 示例代码"
"查找 Core Data 示例实现"
"仅显示 beta 示例代码项目"
```

### 🎥 WWDC 视频搜索

```text
"搜索关于 SwiftUI 的 WWDC 视频"
"查找关于机器学习的 WWDC 会议"
"显示 WWDC 2024 视频"
"搜索 async/await 相关的 WWDC 演讲"
"查找关于 Swift 并发的 WWDC 视频"
"显示以无障碍为主题的 WWDC 会议"
```

### 📺 WWDC 视频详情

```text
"获取 WWDC23 会议 10176 的详情"
"显示 WWDC23 中关于 SwiftData 的会议文字记录"
"获取 WWDC20 会议 10019 的代码示例"
"显示 Vision Pro WWDC 会议的资源"
"获取 'Meet async/await in Swift' 会议的文字记录"
```

### 📋 WWDC 主题和年份

```text
"列出所有 WWDC 主题"
"显示 Swift 主题的 WWDC 视频"
"获取关于开发者工具的 WWDC 视频"
"列出 2023 年的 WWDC 视频"
"显示所有 SwiftUI 和 UI 框架相关的会议"
"获取机器学习相关的 WWDC 内容"
```

### 🛠️ 高级用法

```text
"查找 @State 相关的 API 及平台分析"
"解析 SwiftUI 文档中的所有引用"
"获取 Vision 框架的平台兼容性分析"
"深度搜索与 UIViewController 类似的 API"
```

## 🛠️ 可用工具

| 工具 | 返回内容 |
| ------ | ----------------- |
| `search_apple_docs` | 来自 developer.apple.com 的搜索结果：文档、HIG、示例代码、App Store Connect 帮助和 WWDC 会议 |
| `get_apple_doc_content` | 一个文档页面的 Markdown 内容，可选包含相关、引用和类似 API 以及平台分析 |
| `search_docs_map` | 标题包含查询词的页面，来自磁盘上的文档地图（无需网络） |
| `list_technologies` | Apple 技术索引，按类别、语言和 beta 状态分组 |
| `search_framework_symbols` | 某个框架的符号，按类型和通配符名称筛选 |
| `get_related_apis` | 某个页面的继承、遵循、See Also 和 Topics |
| `resolve_references_batch` | 某个页面引用的页面，附带其摘要和声明 |
| `get_platform_compatibility` | API 在哪些平台可用，以及引入和弃用的版本 |
| `find_similar_apis` | API 的替代项，已弃用的 API 优先显示 Apple 推荐的替代方案 |
| `get_documentation_updates` | 发布说明、框架更新页面和 WWDC What's new 页面 |
| `get_technology_overviews` | Apple 的技术概览指南 |
| `get_sample_code` | Apple 的示例代码项目，按框架和关键词 |
| `list_wwdc_videos` | 按年份、主题和是否含代码列出的 WWDC 会议 |
| `search_wwdc_content` | 对 WWDC 文字记录和代码的全文搜索 |
| `get_wwdc_video` | 单场会议：链接、文字记录、代码示例和相关会议 |
| `get_wwdc_code_examples` | 按所用类型或框架列出的 WWDC 代码示例 |
| `browse_wwdc_topics` | 19 个 WWDC 主题，或某个主题下的会议 |
| `find_related_wwdc_videos` | 与某场会议相关的会议 |
| `list_wwdc_years` | WWDC 年份及其会议数量 |

所有工具都是只读的。失败的调用只返回一个错误结果，并说明可以改为尝试什么。

## 🏗️ 技术架构

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

### 🚀 请求与缓存

- **缓存**: 内存中的 LRU 缓存，带存活时间，每类结果一个（见下表）；搜索结果不缓存
- **浏览器请求头**: 每个发往 Apple 的请求都带有由 `header-generator` 生成的一套新 Safari 请求头
- **重试**: 网络错误、超时和 5xx 响应最多重试 3 次，采用指数退避；其他状态码立即失败
- **限速**: 每分钟最多 100 个请求，搜索之间间隔 15 秒，因为 Apple 对更快的请求会返回空结果
- **校验**: 每个工具的参数在工具运行前都会按其 Zod 4 模式校验
- **运行时**: Bun 1.4.3 和 MCP TypeScript SDK 1.32.1

### 💾 缓存策略

| 内容类型 | 缓存时长 | 缓存大小 |
| ---------- | ---------- | ---------- |
| 文档页面 | 30 分钟 | 500 项 |
| 框架索引 | 1 小时 | 100 项 |
| 技术列表 | 2 小时 | 50 项 |
| 文档更新 | 30 分钟 | 100 项 |
| 示例代码 | 2 小时 | 100 项 |
| 技术概览 | 2 小时 | 100 项 |
| WWDC 数据文件 | 1 小时 | 100 项 |

## 📦 WWDC 数据

WWDC 数据**随包一起打包**，位于 `data/wwdc/` 中，因此 WWDC 工具无需网络：

- 📹 **1,700 场会议**，从 WWDC 2014 到 WWDC 2026
- 📝 **1,416 份文字记录**，**715 场会议含代码示例**
- 🏷️ **19 个主题**可供浏览
- 💾 **41 MB** 的 JSON

`bun scripts/add-wwdc-year.ts <year>` 用于向数据中添加某一年的 WWDC，或刷新该年的数据。

## ⚙️ 配置

| 变量 | 作用 | 默认值 |
| ---------- | -------- | --------- |
| `MCP_DEBUG` | `true` 会在日志中添加调试和信息行 | 关闭 |

服务器只向 stderr 输出日志：在 stdio 传输中，stdout 承载 MCP 消息。

## 🧪 开发

```bash
bun install

bun run dev        # the server, restarted on each change
bun run start      # the server on stdio
bun check          # type check
bun run lint       # Biome
bun run test       # the tests, each file in isolation
bun run ci         # type check, Biome, markdownlint and the tests, as CI runs them
```

`tests/architecture.test.ts` 检查 `src/` 的分层：导入方向只能从 `main` 指向 `server`、`tools`、`docs` 和 `wwdc` 中的用例，再指向 `core`，不能反向。

`bun scripts/build-docs-map.ts api-map/apple-docs-map.tsv` 重建 `search_docs_map` 所读取的文档地图。

## 🤝 贡献

欢迎贡献！以下是开始的方法：

1. **Fork** 仓库
2. **创建** 功能分支: `git checkout -b feature/amazing-feature`
3. **提交** 更改: `git commit -m 'Add amazing feature'`
4. **推送** 到分支: `git push origin feature/amazing-feature`
5. **打开** Pull Request

## 📄 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE)。

## ⚠️ 免责声明

此项目与 Apple Inc. 无关联或认可。它使用公开可用的 Apple 开发者文档 API 用于教育和开发目的。

---

<div align="center">

<p><strong>为 Apple 开发者社区用 ❤️ 制作</strong></p>

搜索 Apple 开发者文档 | iOS 开发 | macOS 开发 | Swift 编程 | SwiftUI | UIKit | Xcode | WWDC 视频 | 模型上下文协议 | MCP 服务器

[报告问题](https://github.com/xsyetopz/apple-docs-mcp-next/issues) • [请求功能](https://github.com/xsyetopz/apple-docs-mcp-next/issues/new) • [文档](https://github.com/xsyetopz/apple-docs-mcp-next#readme)

</div>
