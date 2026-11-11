# Apple Docs MCP - Apple 開発者ドキュメント モデルコンテキストプロトコルサーバー

[![npm バージョン](https://badge.fury.io/js/apple-docs-mcp-next.svg)](https://www.npmjs.com/package/apple-docs-mcp-next)
[![ライセンス: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Apple 開発者ドキュメント MCP サーバー - モデルコンテキストプロトコルで Apple 公式開発者ドキュメント、フレームワーク、API、SwiftUI、UIKit、WWDC ビデオにアクセス。AI 自然言語クエリで iOS、macOS、watchOS、tvOS、visionOS ドキュメントを検索。Claude、Cursor、または MCP 対応 AI アシスタントで Swift/Objective-C コード例、API リファレンス、技術ガイドを即座に取得。

[English](README.md) | **日本語** | [한국어](README.ko.md) | [简体中文](README.zh-CN.md)

## ✨ 機能

- 🔍 **検索**: developer.apple.com 自身の検索で、API リファレンス、Human Interface Guidelines、サンプルコード、App Store Connect ヘルプ、WWDC セッションを横断検索
- 📚 **ドキュメントページ**: Apple のウェブサイトが描画する JSON から、任意のページを Markdown で取得。宣言、概要、コードリスト、Topics、関係、可用性、See Also を含む
- 🗺️ **ドキュメントマップ**: ディスク上にあるドキュメントと HIG のすべてのページタイトル。ネットワークを使わずに検索
- 🔧 **フレームワークのシンボル**: 1 つのフレームワークのシンボルを、ナビゲーター索引から、種類と、ワイルドカード名で絞り込んで取得
- 📋 **テクノロジーカタログ**: カテゴリ、言語、ベータフラグを含む、Apple のテクノロジー索引
- 📰 **ドキュメント更新**: リリースノート、各フレームワークの更新ページ、各 WWDC の What's new ページ
- 🎯 **テクノロジー概要**: Apple のテクノロジー概要ガイドを 1 つのツリーとして
- 💻 **サンプルコード**: Apple のサンプルコードライブラリを、フレームワークとキーワードで検索
- 🔗 **関連、参照、類似 API**: ページの JSON から読み取り。非推奨 API には Apple の代替 API を先頭に表示
- 📊 **プラットフォームの可用性**: 各プラットフォームで API が導入・非推奨になったバージョン
- 🎥 **WWDC ライブラリ**: 2014 年から 2026 年までの 1,700 セッションを、トランスクリプトとコード例付きでサーバーに同梱

## 🚀 クイックスタート

### Claude Desktop（推奨）

Claude Desktop 設定ファイルに以下を追加してください：

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

> **注意**: 古いバージョンが使用される問題が発生した場合、`@latest` を追加して最新バージョンを強制します：
>
> ```json
> "args": ["apple-docs-mcp-next@latest"]
> ```

Claude Desktop を再起動して Apple API について質問を始めましょう！

## 📦 インストール

### 📱 Claude Code

```bash
claude mcp add --scope user apple-docs -- bunx apple-docs-mcp-next@latest
```

`--scope` は、サーバーが読み込まれる場所と使える人を決めます:

| スコープ | 読み込まれる場所 | 保存先 | 向いている場合 |
| ------- | ---------- | ----------- | ------ |
| `user` | 自分のすべてのプロジェクト | `~/.claude.json` | ほとんどの場合: どの Apple プロジェクトでも役に立ちます |
| `project` | このプロジェクト（クローンした全員） | プロジェクトルートの `.mcp.json` | チームで共有するアプリのリポジトリ: このファイルをコミットします |
| `local`（既定） | このプロジェクト（自分のみ） | `~/.claude.json` 内の、プロジェクトのパスの下 | 1 つのプロジェクトで試す場合 |

`project` スコープは次のような `.mcp.json` を書き込みます。手で書くこともできます:

```json
{
  "mcpServers": {
    "apple-docs": {
      "type": "stdio",
      "command": "bunx",
      "args": ["apple-docs-mcp-next@latest"]
    }
  }
}
```

Claude Code は `.mcp.json` のサーバーを使う前に承認を求めます。`claude mcp list` はサーバーが接続できるかを表示し、`claude mcp remove apple-docs` はサーバーを削除します。

**ソースから**: `bunx` は npm からパッケージをダウンロードするため、フォークや npm にないバージョンでは 404 で失敗します。代わりにクローンからサーバーを実行します:

```bash
git clone https://github.com/xsyetopz/apple-docs-mcp-next.git
cd apple-docs-mcp-next
bun install
claude mcp add --scope user apple-docs -- bun run "$PWD/src/main.ts"
```

Claude Code は現在のプロジェクトのフォルダーからサーバーを起動するため、パスは絶対パスにする必要があります。`"$PWD"` はクローンの絶対パスになります。

絶対パスは 1 台のマシンでしか正しくないため、クローンには `user` か `local` スコープが、`project` スコープには `bunx` の形式が向いています。

ログに `Usage: bun run [flags] <file or script>` と出る場合、その設定の `args` が `["run"]` だけになっています。`"run"` の後に `src/main.ts` のパスを追加してください。

[📖 Claude Code MCP ドキュメント](https://code.claude.com/docs/en/mcp)

### 🖱️ Cursor

**設定経由**: 設定 → Cursor 設定 → MCP → 新しいグローバル MCP サーバーを追加

**設定ファイル経由**: すべてのプロジェクトで使うには `~/.cursor/mcp.json` に、1 つのプロジェクトだけで使うにはそのフォルダーの `.cursor/mcp.json` に追加:

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

[📖 Cursor MCP ドキュメント](https://cursor.com/docs/context/mcp)

### 🔷 VS Code

すべてのワークスペースで使うには `~/.copilot/mcp-config.json` に、チームと共有するにはワークスペースのルートの `.mcp.json` に追加します。
後者は Claude Code の `project` スコープが書き込むファイルと同じなので、1 つのファイルで両方に使えます:

```json
{
  "mcpServers": {
    "apple-docs": {
      "type": "stdio",
      "command": "bunx",
      "args": ["apple-docs-mcp-next"]
    }
  }
}
```

コマンドパレットの **MCP: Add Server** は、手順に沿ってサーバーを設定します。

[📖 VS Code MCP 設定](https://code.visualstudio.com/docs/agents/reference/mcp-configuration)

### 🌊 Windsurf

Windsurf MCP 設定に追加:

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

[📖 Windsurf MCP ドキュメント](https://docs.codeium.com/windsurf/mcp)

### ⚡ Zed

Zed の `settings.json` に追加:

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

[📖 Zed コンテキストサーバー ドキュメント](https://zed.dev/docs/context-servers)

### 🔧 Cline

**マーケットプレイス経由**:

1. Cline を開く → メニュー (☰) → MCP サーバー → マーケットプレイス
2. "Apple Docs MCP" を検索 → インストール

**設定経由**: `cline_mcp_settings.json` に追加:

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

### 🟠 Amazon Q Developer CLI

**設定ファイル経由**: `~/.aws/amazonq/mcp.json` に追加:

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

[📖 Amazon Q Developer CLI MCP ドキュメント](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/qdev-mcp.html)

### 🪟 Windows

Windows システムの場合:

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

### ⚙️ 高度なインストール

**グローバルインストール**:

```bash
bun add -g apple-docs-mcp-next
```

**直接使用**（サーバーは stdin と stdout で MCP を話します）:

```bash
bunx apple-docs-mcp-next
```

**開発環境セットアップ**:

```bash
git clone https://github.com/xsyetopz/apple-docs-mcp-next.git
cd apple-docs-mcp-next

bun install
```

## 💬 使用例

### 🔍 スマート検索

```text
"SwiftUI アニメーションを検索"
"withAnimation API のドキュメントを検索"
"Swift の async/await パターンを調べる"
"UITableView のデリゲートメソッドを表示"
"Core Data の NSPersistentContainer の例を検索"
"AVFoundation のビデオ再生 API を検索"
```

### 📚 ドキュメントへのアクセス

```text
"SwiftUI フレームワークの詳細情報を取得"
"関連 API を含む withAnimation API を表示"
"SwiftData のプラットフォーム互換性を取得"
"類似 API を含む UIViewController のドキュメントにアクセス"
"NSManagedObjectContext のドキュメントを表示"
"URLSession の async/await メソッドを取得"
```

### 🔧 フレームワーク探索

```text
"SwiftUI フレームワークの API インデックスを表示"
"すべての UIKit クラスとメソッドをリスト"
"ARKit フレームワークの構造を閲覧"
"WeatherKit API の階層を取得"
"Core ML モデル読み込み API を探索"
"Vision フレームワークの画像解析 API を表示"
```

### 🔗 API 発見

```text
"UIViewController に関連する API を検索"
"withAnimation に類似する API を表示"
"SwiftData のドキュメントからすべての参照を取得"
"Core Data の NSManagedObject の代替手段を探す"
```

### 📋 テクノロジーとプラットフォーム分析

```text
"ベータ版のテクノロジーをリスト"
"Graphics and Games のテクノロジーを表示"
"どの機械学習フレームワークが利用可能？"
"Vision フレームワークのプラットフォーム互換性を分析"
```

### 📰 ドキュメント更新

```text
"最新の WWDC 更新を表示"
"SwiftUI の新機能は？"
"iOS のテクノロジー更新を取得"
"Xcode のリリースノートを表示"
"最新更新のベータ機能を検索"
```

### 🎯 テクノロジー概要

```text
"アプリデザインと UI のテクノロジー概要を表示"
"ゲーム開発の包括的なガイドを取得"
"AI と機械学習の概要を探索"
"iOS 専用のテクノロジーガイドを表示"
"データ管理テクノロジーの概要を取得"
```

### 💻 サンプルコードライブラリ

```text
"SwiftUI サンプルコードプロジェクトを表示"
"機械学習のサンプルコードを検索"
"UIKit のサンプルプロジェクトを取得"
"注目の SwiftUI サンプルコードを表示"
"Core Data のサンプル実装を検索"
"ベータ版のサンプルコードプロジェクトのみを表示"
```

### 🎥 WWDC ビデオ検索

```text
"SwiftUI に関する WWDC ビデオを検索"
"機械学習に関する WWDC セッションを検索"
"WWDC 2024 のビデオを表示"
"async/await に関する WWDC トークを検索"
"Swift 並行処理に関する WWDC ビデオを検索"
"アクセシビリティに焦点を当てた WWDC セッションを表示"
```

### 📺 WWDC ビデオ詳細

```text
"WWDC23 セッション 10176 の詳細を取得"
"SwiftData に関する WWDC23 セッションのトランスクリプトを表示"
"WWDC20 セッション 10019 のコード例を取得"
"Vision Pro WWDC セッションのリソースを表示"
"'Meet async/await in Swift' セッションのトランスクリプトを取得"
```

### 📋 WWDC トピックと年度

```text
"すべての WWDC トピックをリスト"
"Swift トピックの WWDC ビデオを表示"
"開発者ツールに関する WWDC ビデオを取得"
"2023 年の WWDC ビデオをリスト"
"すべての SwiftUI および UI フレームワークのセッションを表示"
"機械学習の WWDC コンテンツを取得"
```

### 🛠️ 高度な使い方

```text
"プラットフォーム分析付きで @State の関連 API を検索"
"SwiftUI ドキュメントからすべての参照を解決"
"Vision フレームワークのプラットフォーム互換性分析を取得"
"ディープサーチで UIViewController に類似する API を検索"
```

## 🛠️ 利用可能なツール

| ツール | 返すもの |
| ------ | ----------------- |
| `search_apple_docs` | developer.apple.com の検索結果: ドキュメント、HIG、サンプルコード、App Store Connect ヘルプ、WWDC セッション |
| `get_apple_doc_content` | 1 つのドキュメントページを Markdown で |
| `search_docs_map` | ドキュメントマップ（ディスク上）からタイトルに検索語を含むページ（ネットワークなし） |
| `list_technologies` | カテゴリ、言語、ベータ状況で整理された Apple のテクノロジー索引 |
| `search_framework_symbols` | 1 つのフレームワークのシンボル。種類とワイルドカード名で絞り込み |
| `get_api_relations` | 1 つのページの関連、参照、類似 API、またはプラットフォーム対応: `kind` は "related"、"references"、"similar"、"platforms" |
| `get_documentation_updates` | リリースノート、フレームワークの更新ページ、WWDC の What's new ページ |
| `get_technology_overviews` | Apple のテクノロジー概要ガイド |
| `get_sample_code` | Apple のサンプルコードプロジェクト。フレームワークとキーワードで検索 |
| `list_wwdc_videos` | 年、トピック、コードの有無で絞り込んだ WWDC セッション。絞り込みなしでは年とトピック ID の一覧 |
| `search_wwdc_content` | WWDC のトランスクリプトとコードの全文検索 |
| `get_wwdc_video` | 1 つのセッション: リンク、コード例、関連セッション。トランスクリプトは指定時のみ |
| `get_wwdc_code_examples` | 使われている型またはフレームワークで絞り込んだ WWDC のコード例 |
| `find_related_wwdc_videos` | 1 つのセッションに関連するセッション |

すべてのツールは読み取り専用です。失敗した呼び出しは、代わりに何を試すべきかを示す 1 つのエラー結果を返します。

どの回答も 22,000 バイトを超えないため、10,000 トークン未満に収まります。それより長い回答は複数のパートに分かれます。各パートは `Part 1 of 5` のような行で終わり、すべてのツールが受け取る `part` 引数（既定は 1）でパートを選びます。パートが開いたままのコードブロックで終わることはありません。

## 🏗️ 技術アーキテクチャ

```text
apple-docs-mcp-next/
├── 🔧 src/
│   ├── main.ts                       # 実行ファイル: stdio 上のサーバー
│   ├── server.ts                     # コンポジションルート: MCP サーバーとその指示
│   ├── tools/                        # MCP 側: ツールごとに 1 つの定義（名前、説明、zod 入力スキーマ、ユースケース）
│   │   ├── define-tool.ts            # 定義を登録。呼び出しごとに Markdown か 1 つのエラー結果
│   │   ├── answer-parts.ts           # 長い回答を 22,000 バイト以下のパートに分割
│   │   └── index.ts                  # サーバーが提供するすべてのツール
│   ├── docs/                         # Apple のドキュメント、HIG、サンプルコード、ヘルプページのユースケース
│   ├── wwdc/                         # 同梱の WWDC データのユースケースと、その抽出器
│   ├── core/                         # HTTP クライアント、キャッシュ、エラー、ロガー、定数
│   └── types/                        # DocC と取得したレスポンスの型（生成物）
├── 🧪 tests/                         # レイヤーごとの Bun テスト。import ルールは tests/architecture.test.ts
├── 📄 package.json                   # パッケージ設定
└── 📖 README.md                      # このファイル
```

### 🚀 リクエストとキャッシュ

- **キャッシュ**: 種類ごとに（下記）存続時間付きのメモリ内 LRU キャッシュ。検索結果はキャッシュしない
- **ブラウザーヘッダー**: Apple へのリクエストごとに、`header-generator` による新しい Safari ヘッダーのセットを付ける
- **リトライ**: ネットワークエラー、タイムアウト、5xx の応答は指数バックオフで 3 回リトライ。その他のステータスは即座に失敗
- **ペース調整**: 1 分あたり最大 100 リクエスト。検索は 15 秒間隔。Apple は速すぎる検索に結果を返さないため
- **検証**: すべてのツールの引数は、ツールを実行する前に Zod 4 スキーマで検査
- **回答のサイズ**: 1 回の呼び出しで最大 22,000 バイト。残りは `part` で取得
- **ランタイム**: Bun 1.4.4 と MCP TypeScript SDK 2.4.0（`@modelcontextprotocol/server`）

### 💾 キャッシュ戦略

| コンテンツタイプ | キャッシュ期間 | キャッシュサイズ |
| -------------- | ---------------- | ------------ |
| ドキュメントページ | 30分 | 500 エントリ |
| フレームワークインデックス | 1時間 | 100 エントリ |
| テクノロジー一覧 | 2時間 | 50 エントリ |
| ドキュメント更新 | 30分 | 100 エントリ |
| サンプルコード | 2時間 | 100 エントリ |
| テクノロジー概要 | 2時間 | 100 エントリ |
| WWDC データファイル | 1時間 | 100 エントリ |

## 📦 WWDC データ

WWDC データは **パッケージに同梱** されています（`data/wwdc/`）。そのため WWDC ツールはネットワークを必要としません:

- 📹 WWDC 2014 から WWDC 2026 までの **1,700 セッション**
- 📝 **1,416 件のトランスクリプト** と **715 セッションのコード例**
- 🏷️ 閲覧用の **19 トピック**
- 💾 JSON で **41 MB**

`bun scripts/add-wwdc-year.ts <year>` は、WWDC の年をデータに追加、または更新します。

## ⚙️ 設定

| 変数 | 効果 | 既定値 |
| ---------- | -------- | --------- |
| `MCP_DEBUG` | `true` にすると、デバッグ行と情報行をログに追加 | オフ |

サーバーのログは stderr のみに出力されます。stdio トランスポートでは stdout が MCP メッセージを運ぶためです。

## 🧪 開発

```bash
bun install
just setup         # the pinned tools and the git hooks

bun run dev        # the server, restarted on each change
bun run start      # the server on stdio
just typecheck     # type check
just lint          # oxlint, markdownlint and the hook scripts
just test          # the tests
just verify        # format check, type check, lint, guard and the tests, as CI runs them
```

レシピは [`just`](https://just.systems) で実行し、`just` だけを実行するとレシピの一覧が出ます。チェックとそのルールは `typescript-bedrock` のものです。

`tests/architecture.test.ts` は `src/` のレイヤーを検査します: import は `main` から `server`、`tools`、`docs` と `wwdc` のユースケース、`core` へ向かい、逆向きにはなりません。

`bun scripts/build-docs-map.ts api-map/apple-docs-map.tsv` は `search_docs_map` が読むドキュメントマップを再構築します。

## 🤝 コントリビューション

コントリビューション歓迎！始め方：

1. リポジトリを **Fork**
2. 機能ブランチを **作成**: `git checkout -b feature/amazing-feature`
3. 変更を **コミット**: `git commit -m 'Add amazing feature'`
4. ブランチに **プッシュ**: `git push origin feature/amazing-feature`
5. Pull Request を **開く**

## 📄 ライセンス

MIT ライセンス - 詳細は [LICENSE](LICENSE) をご覧ください。

## ⚠️ 免責事項

このプロジェクトは Apple Inc. と提携または承認されていません。教育および開発目的で公開されている Apple 開発者ドキュメント API を使用しています。

---

Apple 開発者コミュニティのために ❤️ で作成

Apple 開発者ドキュメント検索 | iOS 開発 | macOS 開発 | Swift プログラミング | SwiftUI | UIKit | Xcode | WWDC ビデオ | モデルコンテキストプロトコル | MCP サーバー

[問題を報告](https://github.com/xsyetopz/apple-docs-mcp-next/issues) • [機能リクエスト](https://github.com/xsyetopz/apple-docs-mcp-next/issues/new) • [ドキュメント](https://github.com/xsyetopz/apple-docs-mcp-next#readme)
