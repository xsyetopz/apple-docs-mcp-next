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

<details>
<summary><strong>📱 Claude Code</strong></summary>

```bash
claude mcp add apple-docs -- bunx apple-docs-mcp-next@latest
```

[📖 Claude Code MCP ドキュメント](https://docs.anthropic.com/en/docs/claude-code/mcp)

</details>

<details>
<summary><strong>🖱️ Cursor</strong></summary>

**設定経由**: 設定 → Cursor 設定 → MCP → 新しいグローバル MCP サーバーを追加

**設定ファイル経由**: `~/.cursor/mcp.json` に追加:

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

[📖 Cursor MCP ドキュメント](https://docs.cursor.com/context/mcp)

</details>

<details>
<summary><strong>🔷 VS Code</strong></summary>

VS Code MCP 設定に追加:

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

[📖 VS Code MCP ドキュメント](https://code.visualstudio.com/docs/editor/mcp)

</details>

<details>
<summary><strong>🌊 Windsurf</strong></summary>

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

</details>

<details>
<summary><strong>⚡ Zed</strong></summary>

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

</details>

<details>
<summary><strong>🔧 Cline</strong></summary>

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

</details>

<details>
<summary><strong>🟠 Amazon Q Developer CLI</strong></summary>

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

</details>

<details>
<summary><strong>🪟 Windows</strong></summary>

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

</details>

<details>
<summary><strong>⚙️ 高度なインストール</strong></summary>

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

</details>

## 💬 使用例

### 🔍 スマート検索

```text
"SwiftUI アニメーションを検索"
"CoreML モデル読み込み方法を見つける"
"Swift の async/await パターンを調べる"
"AlarmKit スケジューリング例を表示"
```

### 📚 フレームワーク深掘り

```text
"SwiftUI フレームワークの詳細情報を取得"
"iOS 18 フレームワークの新機能は？"
"Vision フレームワークの機能について教えて"
"すべての WeatherKit API を表示"
```

### 🔧 API 探索

```text
"UIViewController ライフサイクルメソッドを表示"
"SwiftData モデル作成の詳細を取得"
"AlarmAttributes のプロパティは何？"
"すべての ARKit アンカータイプをリスト"
```

### 💡 サンプルコードとチュートリアル

```text
"アラームスケジューリングのサンプルコードを見つける"
"SwiftUI チュートリアル例を表示"
"カメラキャプチャのサンプルコードを取得"
"Core Data マイグレーション例を見つける"
```

### 📋 テクノロジー発見

```text
"iOS 26 のすべてのベータフレームワークをリスト"
"グラフィックス & ゲームテクノロジーを表示"
"どの機械学習フレームワークが利用可能？"
"すべての watchOS フレームワークを閲覧"
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
"UIKit サンプルプロジェクトを取得"
"注目の WWDC サンプルコードを表示"
"Core Data サンプル実装を検索"
"ベータサンプルコードプロジェクトのみを表示"
```

### 🎥 WWDC ビデオ検索

```text
"SwiftUI に関する WWDC ビデオを検索"
"機械学習の WWDC セッションを検索"
"WWDC 2024 ビデオを表示"
"async/await WWDC トークを検索"
"Swift 並行処理に関する WWDC ビデオを検索"
"アクセシビリティに焦点を当てた WWDC セッションを表示"
```

### 📺 WWDC ビデオ詳細

```text
"WWDC セッション 10176 の詳細を取得"
"WWDC23 SwiftData セッションのトランスクリプトを表示"
"WWDC ビデオ 10019 のコード例を取得"
"Vision Pro WWDC セッションのリソースを表示"
"'Meet async/await in Swift' セッションのトランスクリプトを取得"
```

### 📋 WWDC トピックと年度

```text
"すべての WWDC トピックをリスト"
"Swift トピックの WWDC ビデオを表示"
"開発者ツールに関する WWDC ビデオを取得"
"2023 年の WWDC ビデオをリスト"
"すべての SwiftUI および UI フレームワークセッションを表示"
"機械学習 WWDC コンテンツを取得"
```

## 🛠️ 利用可能なツール

| ツール | 返すもの |
| ------ | ----------------- |
| `search_apple_docs` | developer.apple.com の検索結果: ドキュメント、HIG、サンプルコード、App Store Connect ヘルプ、WWDC セッション |
| `get_apple_doc_content` | 1 つのドキュメントページを Markdown で。任意で関連、参照、類似 API とプラットフォーム分析を含む |
| `search_docs_map` | ドキュメントマップ（ディスク上）からタイトルに検索語を含むページ（ネットワークなし） |
| `list_technologies` | カテゴリ、言語、ベータ状況で整理された Apple のテクノロジー索引 |
| `search_framework_symbols` | 1 つのフレームワークのシンボル。種類とワイルドカード名で絞り込み |
| `get_related_apis` | 1 つのページの継承、準拠、See Also、Topics |
| `resolve_references_batch` | 1 つのページが参照するページ。その概要と宣言を含む |
| `get_platform_compatibility` | API が利用可能になった、導入された、非推奨になった場所 |
| `find_similar_apis` | API の代替。非推奨 API は Apple の代替を先頭に表示 |
| `get_documentation_updates` | リリースノート、フレームワークの更新ページ、WWDC の What's new ページ |
| `get_technology_overviews` | Apple のテクノロジー概要ガイド |
| `get_sample_code` | Apple のサンプルコードプロジェクト。フレームワークとキーワードで検索 |
| `list_wwdc_videos` | 年、トピック、コードの有無で絞り込んだ WWDC セッション |
| `search_wwdc_content` | WWDC のトランスクリプトとコードの全文検索 |
| `get_wwdc_video` | 1 つのセッション: リンク、トランスクリプト、コード例、関連セッション |
| `get_wwdc_code_examples` | 使われている型またはフレームワークで絞り込んだ WWDC のコード例 |
| `browse_wwdc_topics` | 19 の WWDC トピック、または 1 つのトピックのセッション |
| `find_related_wwdc_videos` | 1 つのセッションに関連するセッション |
| `list_wwdc_years` | WWDC の年と、それぞれのセッション数 |

すべてのツールは読み取り専用です。失敗した呼び出しは、代わりに何を試すべきかを示す 1 つのエラー結果を返します。

## 🏗️ 技術アーキテクチャ

```text
apple-docs-mcp-next/
├── 🔧 src/
│   ├── main.ts                       # 実行ファイル: stdio 上のサーバー
│   ├── server.ts                     # コンポジションルート: MCP サーバーとその指示
│   ├── tools/                        # MCP 側: ツールごとに 1 つの定義（名前、説明、zod 入力スキーマ、ユースケース）
│   │   ├── define-tool.ts            # 定義を登録。呼び出しごとに Markdown か 1 つのエラー結果
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
- **ランタイム**: Bun 1.4.3 と MCP TypeScript SDK 1.32.1

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

bun run dev        # the server, restarted on each change
bun run start      # the server on stdio
bun check          # type check
bun run lint       # Biome
bun run test       # the tests, each file in isolation
bun run ci         # type check, Biome, markdownlint and the tests, as CI runs them
```

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

<div align="center">

<p><strong>Apple 開発者コミュニティのために ❤️ で作成</strong></p>

Apple 開発者ドキュメント検索 | iOS 開発 | macOS 開発 | Swift プログラミング | SwiftUI | UIKit | Xcode | WWDC ビデオ | モデルコンテキストプロトコル | MCP サーバー

[問題を報告](https://github.com/xsyetopz/apple-docs-mcp-next/issues) • [機能リクエスト](https://github.com/xsyetopz/apple-docs-mcp-next/issues/new) • [ドキュメント](https://github.com/xsyetopz/apple-docs-mcp-next#readme)

</div>
