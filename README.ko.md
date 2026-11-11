# Apple Docs MCP - Apple 개발자 문서 모델 컨텍스트 프로토콜 서버

[![npm 버전](https://badge.fury.io/js/apple-docs-mcp-next.svg)](https://www.npmjs.com/package/apple-docs-mcp-next)
[![라이선스: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Apple 개발자 문서 MCP 서버 - 모델 컨텍스트 프로토콜을 통해 Apple 공식 개발자 문서, 프레임워크, API, SwiftUI, UIKit 및 WWDC 비디오에 액세스하세요.
AI 기반 자연어 쿼리로 iOS, macOS, watchOS, tvOS, visionOS 문서를 검색합니다.
Claude, Cursor 또는 MCP 호환 AI 어시스턴트에서 Swift/Objective-C 코드 예제, API 레퍼런스 및 기술 가이드를 즉시 확인할 수 있습니다.

[English](README.md) | [日本語](README.ja.md) | **한국어** | [简体中文](README.zh-CN.md)

## ✨ 기능

- 🔍 **검색**: developer.apple.com 자체 검색 - API 레퍼런스, Human Interface Guidelines, 샘플 코드, App Store Connect 도움말 및 WWDC 세션을 검색합니다
- 📚 **문서 페이지**: 웹사이트가 렌더링하는 JSON에서 가져온 모든 페이지를 Markdown으로 제공합니다. 선언, 개요, 코드 목록, Topics, 관계, 가용성 및 See Also를 포함합니다
- 🗺️ **문서 맵**: 디스크에 있는 문서와 HIG의 모든 페이지 제목을 네트워크 없이 검색합니다
- 🔧 **프레임워크 심볼**: 탐색기 색인에서 가져온 한 프레임워크의 심볼을 종류와 와일드카드 이름으로 필터링합니다
- 📋 **기술 카탈로그**: 카테고리, 언어, 베타 플래그를 포함한 Apple 기술 색인
- 📰 **문서 업데이트**: 릴리스 노트, 각 프레임워크의 업데이트 페이지, 각 WWDC의 What's new 페이지
- 🎯 **기술 개요**: Apple의 Technology Overviews 가이드를 하나의 트리로 제공합니다
- 💻 **샘플 코드**: 프레임워크와 키워드별로 찾는 Apple 샘플 코드 라이브러리
- 🔗 **관련, 참조 및 유사 API**: 페이지의 JSON에서 읽습니다. 사용 중단된 API는 Apple의 대체 API가 먼저 나옵니다
- 📊 **플랫폼 가용성**: 각 플랫폼이 API를 도입하거나 사용 중단한 버전
- 🎥 **WWDC 라이브러리**: 서버에 번들된 2014년부터 2026년까지의 세션 1,700개, 대본과 코드 예제 포함

## 🚀 빠른 시작

### Claude Desktop (권장)

Claude Desktop 구성 파일에 다음을 추가하세요:

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

> **참고**: 이전 버전이 사용되는 문제가 발생하면 `@latest`를 추가하여 최신 버전을 강제합니다:
>
> ```json
> "args": ["apple-docs-mcp-next@latest"]
> ```

Claude Desktop을 재시작하고 Apple API에 대해 질문해보세요!

## 📦 설치

### 📱 Claude Code

```bash
claude mcp add --scope user apple-docs -- bunx apple-docs-mcp-next@latest
```

`--scope`는 서버가 로드되는 곳과 사용할 수 있는 사람을 정합니다:

| 스코프 | 로드되는 곳 | 저장 위치 | 알맞은 경우 |
| ------- | ---------- | ----------- | ------ |
| `user` | 내 모든 프로젝트 | `~/.claude.json` | 대부분의 경우: 어떤 Apple 프로젝트에서도 쓸모가 있습니다 |
| `project` | 이 프로젝트 (클론한 모든 사람) | 프로젝트 루트의 `.mcp.json` | 팀이 공유하는 앱 저장소: 이 파일을 커밋하세요 |
| `local` (기본값) | 이 프로젝트 (나만) | `~/.claude.json` 안의 프로젝트 경로 아래 | 한 프로젝트에서 시험해 볼 때 |

`project` 스코프는 다음과 같은 `.mcp.json`을 씁니다. 직접 작성해도 됩니다:

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

Claude Code는 `.mcp.json`의 서버를 사용하기 전에 승인을 요청합니다. `claude mcp list`는 서버가 연결되는지 보여주고, `claude mcp remove apple-docs`는 서버를 제거합니다.

**소스에서 설치**: `bunx`는 npm에서 패키지를 내려받으므로, 포크나 npm에 없는 버전에서는 404로 실패합니다. 대신 클론에서 서버를 실행하세요:

```bash
git clone https://github.com/xsyetopz/apple-docs-mcp-next.git
cd apple-docs-mcp-next
bun install
claude mcp add --scope user apple-docs -- bun run "$PWD/src/main.ts"
```

Claude Code는 현재 프로젝트 폴더에서 서버를 시작하므로 경로는 절대 경로여야 합니다. `"$PWD"`는 클론의 절대 경로가 됩니다.

절대 경로는 한 대의 컴퓨터에서만 맞으므로, 클론에는 `user` 또는 `local` 스코프가 알맞고 `project` 스코프에는 `bunx` 형식이 알맞습니다.

로그에 `Usage: bun run [flags] <file or script>`가 보이면 그 항목의 `args`가 `["run"]`뿐인 것입니다. `"run"` 뒤에 `src/main.ts`의 경로를 추가하세요.

[📖 Claude Code MCP 문서](https://code.claude.com/docs/en/mcp)

### 🖱️ Cursor

**설정을 통해**: 설정 → Cursor 설정 → MCP → 새 글로벌 MCP 서버 추가

**구성 파일을 통해**: 모든 프로젝트에서 쓰려면 `~/.cursor/mcp.json`에, 한 프로젝트에서만 쓰려면 그 폴더의 `.cursor/mcp.json`에 추가:

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

[📖 Cursor MCP 문서](https://cursor.com/docs/context/mcp)

### 🔷 VS Code

모든 작업 영역에서 쓰려면 `~/.copilot/mcp-config.json`에, 팀과 공유하려면 작업 영역 루트의 `.mcp.json`에 추가하세요.
후자는 Claude Code의 `project` 스코프가 쓰는 파일과 같으므로, 파일 하나로 둘 다 쓸 수 있습니다:

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

명령 팔레트의 **MCP: Add Server**는 단계별로 서버를 설정합니다.

[📖 VS Code MCP 구성](https://code.visualstudio.com/docs/agents/reference/mcp-configuration)

### 🌊 Windsurf

Windsurf MCP 구성에 추가:

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

[📖 Windsurf MCP 문서](https://docs.codeium.com/windsurf/mcp)

### ⚡ Zed

Zed `settings.json`에 추가:

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

[📖 Zed 컨텍스트 서버 문서](https://zed.dev/docs/context-servers)

### 🔧 Cline

**마켓플레이스를 통해**:

1. Cline 열기 → 메뉴 (☰) → MCP 서버 → 마켓플레이스
2. "Apple Docs MCP" 검색 → 설치

**구성을 통해**: `cline_mcp_settings.json`에 추가:

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

**구성 파일을 통해**: `~/.aws/amazonq/mcp.json`에 추가:

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

[📖 Amazon Q Developer CLI MCP 문서](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/qdev-mcp.html)

### 🪟 Windows

Windows 시스템의 경우:

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

### ⚙️ 고급 설치

**전역 설치**:

```bash
bun add -g apple-docs-mcp-next
```

**직접 사용** (서버는 stdin과 stdout으로 MCP를 주고받습니다):

```bash
bunx apple-docs-mcp-next
```

**개발 환경 설정**:

```bash
git clone https://github.com/xsyetopz/apple-docs-mcp-next.git
cd apple-docs-mcp-next

bun install
```

## 💬 사용 예제

### 🔍 스마트 검색

```text
"SwiftUI 애니메이션 검색"
"withAnimation API 문서 찾기"
"Swift의 async/await 패턴 찾아보기"
"UITableView 델리게이트 메서드 보여줘"
"Core Data NSPersistentContainer 예제 검색"
"AVFoundation 비디오 재생 API 찾기"
```

### 📚 문서 접근

```text
"SwiftUI 프레임워크의 상세 정보 가져오기"
"관련 API와 함께 withAnimation API 보여줘"
"SwiftData의 플랫폼 호환성 가져오기"
"유사한 API와 함께 UIViewController 문서 보여줘"
"NSManagedObjectContext 문서 보여줘"
"URLSession async/await 메서드 가져오기"
```

### 🔧 프레임워크 탐색

```text
"SwiftUI 프레임워크 API 색인 보여줘"
"모든 UIKit 클래스와 메서드 나열"
"ARKit 프레임워크 구조 살펴보기"
"WeatherKit API 계층 구조 가져오기"
"Core ML 모델 로딩 API 탐색"
"Vision 프레임워크 이미지 분석 API 보여줘"
```

### 🔗 API 탐색

```text
"UIViewController 관련 API 찾기"
"withAnimation과 유사한 API 보여줘"
"SwiftData 문서의 모든 참조 가져오기"
"Core Data NSManagedObject의 대안 찾기"
```

### 📋 기술 및 플랫폼 분석

```text
"베타 단계의 기술 나열"
"Graphics and Games 기술 보여줘"
"어떤 머신러닝 프레임워크를 사용할 수 있나?"
"Vision 프레임워크의 플랫폼 호환성 분석"
```

### 📰 문서 업데이트

```text
"최신 WWDC 업데이트 보여줘"
"SwiftUI의 새로운 기능은?"
"iOS 기술 업데이트 가져오기"
"Xcode 릴리스 노트 보여줘"
"최신 업데이트에서 베타 기능 찾기"
```

### 🎯 기술 개요

```text
"앱 디자인 및 UI에 대한 기술 개요 보여줘"
"게임 개발을 위한 종합 가이드 가져오기"
"AI 및 머신러닝 개요 탐색"
"iOS 전용 기술 가이드 보여줘"
"데이터 관리 기술 개요 가져오기"
```

### 💻 샘플 코드 라이브러리

```text
"SwiftUI 샘플 코드 프로젝트 보여줘"
"머신러닝 샘플 코드 찾기"
"UIKit 예제 프로젝트 가져오기"
"추천 SwiftUI 샘플 코드 보여줘"
"Core Data 샘플 구현 찾기"
"베타 샘플 코드 프로젝트만 보여줘"
```

### 🎥 WWDC 비디오 검색

```text
"SwiftUI에 관한 WWDC 비디오 검색"
"머신러닝 WWDC 세션 찾기"
"WWDC 2024 비디오 보여줘"
"async/await WWDC 강연 검색"
"Swift 동시성에 관한 WWDC 비디오 찾기"
"접근성 중심 WWDC 세션 보여줘"
```

### 📺 WWDC 비디오 상세 정보

```text
"WWDC23 세션 10176의 상세 정보 가져오기"
"WWDC23 SwiftData 세션의 대본 보여줘"
"WWDC20 세션 10019의 코드 예제 가져오기"
"Vision Pro WWDC 세션의 리소스 보여줘"
"'Meet async/await in Swift' 세션의 대본 가져오기"
```

### 📋 WWDC 주제 및 연도

```text
"모든 WWDC 주제 나열"
"Swift 주제의 WWDC 비디오 보여줘"
"개발자 도구에 관한 WWDC 비디오 가져오기"
"2023년 WWDC 비디오 나열"
"모든 SwiftUI 및 UI 프레임워크 세션 보여줘"
"머신러닝 WWDC 콘텐츠 가져오기"
```

### 🛠️ 고급 사용

```text
"플랫폼 분석과 함께 @State 관련 API 찾기"
"SwiftUI 문서의 모든 참조 해석"
"Vision 프레임워크의 플랫폼 호환성 분석 가져오기"
"심층 검색으로 UIViewController와 유사한 API 찾기"
```

## 🛠️ 사용 가능한 도구

| 도구 | 반환 내용 |
| ------ | ----------------- |
| `search_apple_docs` | developer.apple.com의 검색 결과: 문서, HIG, 샘플 코드, App Store Connect 도움말 및 WWDC 세션 |
| `get_apple_doc_content` | 문서 페이지 하나를 Markdown으로 |
| `search_docs_map` | 디스크의 문서 맵에서 제목에 검색어가 포함된 페이지 (네트워크 사용 없음) |
| `list_technologies` | 카테고리, 언어, 베타 상태별 Apple 기술 색인 |
| `search_framework_symbols` | 한 프레임워크의 심볼, 종류와 와일드카드 이름별 |
| `get_api_relations` | 한 페이지의 관련, 참조, 유사 API 또는 플랫폼 지원: `kind`는 "related", "references", "similar", "platforms" |
| `get_documentation_updates` | 릴리스 노트, 프레임워크 업데이트 페이지 및 WWDC What's new 페이지 |
| `get_technology_overviews` | Apple의 Technology Overviews 가이드 |
| `get_sample_code` | 프레임워크와 키워드별 Apple 샘플 코드 프로젝트 |
| `list_wwdc_videos` | 연도, 주제, 코드별 WWDC 세션. 필터가 없으면 연도와 주제 ID 목록 |
| `search_wwdc_content` | WWDC 대본과 코드의 전문 검색 |
| `get_wwdc_video` | 세션 하나: 링크, 코드 예제 및 관련 세션, 요청 시 대본 |
| `get_wwdc_code_examples` | 사용하는 타입이나 프레임워크별 WWDC 코드 예제 |
| `find_related_wwdc_videos` | 한 세션과 관련된 세션 |

모든 도구는 읽기 전용입니다. 호출이 실패하면 대신 무엇을 시도할지 알려주는 오류 결과 하나를 반환합니다.

어떤 응답도 22,000바이트를 넘지 않으므로 10,000토큰 미만으로 유지됩니다. 그보다 긴 응답은 여러 파트로 나뉩니다. 각 파트는 `Part 1 of 5`와 같은 줄로 끝나고, 모든 도구가 받는 `part` 인수(기본값 1)로 파트를 고릅니다. 파트가 열린 코드 블록 안에서 끝나는 일은 없습니다.

## 🏗️ 기술 아키텍처

```text
apple-docs-mcp-next/
├── 🔧 src/
│   ├── main.ts                       # Executable: the server on stdio
│   ├── server.ts                     # Composition root: the MCP server and its instructions
│   ├── tools/                        # MCP side: one spec per tool (name, description, zod input schema, use case)
│   │   ├── define-tool.ts            # Registers a spec; Markdown or one error result per call
│   │   ├── answer-parts.ts           # Cuts a long answer into parts of at most 22,000 bytes
│   │   └── index.ts                  # Every tool the server offers
│   ├── docs/                         # Use cases for Apple's documentation, HIG, sample code and help pages
│   ├── wwdc/                         # Use cases for the bundled WWDC data, and its extractors
│   ├── core/                         # HTTP client, caches, errors, logger, constants
│   └── types/                        # DocC and captured response types (generated)
├── 🧪 tests/                         # Bun tests, by layer, plus tests/architecture.test.ts for the import rules
├── 📄 package.json                   # Package configuration
└── 📖 README.md                      # This file
```

### 🚀 요청과 캐싱

- **캐시**: 종류별 답변마다 하나씩, 각각 수명(TTL)이 있는 메모리 내 LRU 캐시 (아래 참조). 검색 결과는 캐시하지 않습니다
- **브라우저 헤더**: Apple로 가는 각 요청에는 `header-generator`가 만든 새 Safari 헤더 세트가 포함됩니다
- **재시도**: 네트워크 오류, 시간 초과 및 5xx 응답은 지수 백오프로 3번 재시도합니다. 다른 상태는 즉시 실패합니다
- **속도 조절**: 분당 최대 100개 요청, 검색은 15초 간격.
  Apple은 더 빠른 요청에 결과를 주지 않기 때문입니다
- **검증**: 도구를 실행하기 전에 모든 도구의 인수를 Zod 4 스키마로 검사합니다
- **응답 크기**: 호출당 최대 22,000바이트. 나머지는 `part`로 가져옵니다
- **런타임**: Bun 1.4.4 및 MCP TypeScript SDK 2.4.0 (`@modelcontextprotocol/server`)

### 💾 캐싱 전략

| 콘텐츠 타입 | 캐시 기간 | 캐시 크기 |
| -------------- | ---------------- | ------------ |
| 문서 페이지 | 30분 | 500 항목 |
| 프레임워크 인덱스 | 1시간 | 100 항목 |
| 기술 목록 | 2시간 | 50 항목 |
| 문서 업데이트 | 30분 | 100 항목 |
| 샘플 코드 | 2시간 | 100 항목 |
| 기술 개요 | 2시간 | 100 항목 |
| WWDC 데이터 파일 | 1시간 | 100 항목 |

## 📦 WWDC 데이터

WWDC 데이터는 **패키지에 번들**되어 `data/wwdc/`에 있으므로, WWDC 도구는 네트워크가 필요 없습니다:

- 📹 WWDC 2014부터 WWDC 2026까지 **1,700개 세션**
- 📝 **1,416개 대본**과 **715개 코드 예제가 있는 세션**
- 🏷️ 탐색용 **19개 주제**
- 💾 JSON **41 MB**

`bun scripts/add-wwdc-year.ts <year>`는 WWDC 연도를 데이터에 추가하거나 새로 고칩니다.

## ⚙️ 설정

| 변수 | 효과 | 기본값 |
| ---------- | -------- | --------- |
| `MCP_DEBUG` | `true`로 설정하면 로그에 디버그 및 정보 줄을 추가 | 꺼짐 |

서버는 로그를 stderr에만 기록합니다. stdio 전송에서는 stdout이 MCP 메시지를 전달하기 때문입니다.

## 🧪 개발

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

레시피는 [`just`](https://just.systems)로 실행하며, `just`만 실행하면 레시피 목록이 나옵니다. 검사와 그 규칙은 `typescript-bedrock`에서 옵니다.

`tests/architecture.test.ts`는 `src/`의 계층을 검사합니다: `main`에서 `server`, `tools`, `docs`와 `wwdc`의 유스케이스, `core`로만 import가 향하며 그 반대는 허용되지 않습니다.

`bun scripts/build-docs-map.ts api-map/apple-docs-map.tsv`는 `search_docs_map`이 읽는 문서 맵을 다시 빌드합니다.

## 🤝 기여

기여를 환영합니다! 시작하는 방법:

1. 저장소를 **Fork**
2. 기능 브랜치 **생성**: `git checkout -b feature/amazing-feature`
3. 변경사항 **커밋**: `git commit -m 'Add amazing feature'`
4. 브랜치에 **푸시**: `git push origin feature/amazing-feature`
5. Pull Request **열기**

## 📄 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE)를 참조하세요.

## ⚠️ 면책조항

이 프로젝트는 Apple Inc.와 제휴하거나 승인받지 않았습니다. 교육 및 개발 목적으로 공개적으로 사용 가능한 Apple 개발자 문서 API를 사용합니다.

---

Apple 개발자 커뮤니티를 위해 ❤️로 제작

Apple 개발자 문서 검색 | iOS 개발 | macOS 개발 | Swift 프로그래밍 | SwiftUI | UIKit | Xcode | WWDC 비디오 | 모델 컨텍스트 프로토콜 | MCP 서버

[문제 신고](https://github.com/xsyetopz/apple-docs-mcp-next/issues) • [기능 요청](https://github.com/xsyetopz/apple-docs-mcp-next/issues/new) • [문서](https://github.com/xsyetopz/apple-docs-mcp-next#readme)
