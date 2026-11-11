# Apple Docs MCP Tests

This directory contains the tests for the Apple Docs MCP server.
They use `bun:test`.

## Test Structure

```text
tests/
├── helpers/                         # Shared test data
│   └── test-helpers.ts
├── mocks/
│   ├── http-client.mock.ts          # Spies on the HTTP client
│   └── tool-client.ts               # An MCP client linked to the server in memory
├── core/                            # Tests for src/core: the HTTP client and the errors
├── docs/                            # Tests for the use cases in src/docs
├── wwdc/                            # Tests for the use cases and extractors in src/wwdc
├── tools/                           # Tests for src/tools: tool registration and answers in parts
├── architecture.test.ts             # The layers of src/ and the direction of their imports
├── response-format.test.ts          # One text result per tool call, over MCP
├── response-format-tools.test.ts    # The same, for the tools that read Apple's JSON
├── server.test.ts                   # The tools a client lists, and how the server answers a bad call
└── setup.ts                         # Preload for every test file
```

`tests/setup.ts` is listed in `bunfig.toml` as a preload (`[test] preload`).
Before each test it silences `console.error` and makes `fetch` reject, so a test that reaches the network fails.
After each test it restores every spy.

## Running Tests

```bash
# Run all tests
just test

# Run one test file
bun test tests/core/http-client.test.ts
```

`bunfig.toml` runs the files in random order and reports coverage.

## Key Test Patterns

### Mocking

- The test files share one process, so a test replaces a function with `spyOn(object, "method")` in `beforeEach` or in the test itself, never with `mock.module`
- `spyOnHttpClient()` from `mocks/http-client.mock.ts` replaces the HTTP client's requests, and `stubApple()` from `mocks/tool-client.ts` answers them by URL
- A test that fills a cache clears it in `beforeEach`
- A tool binds its use case when its module loads, so a spy on the use case's export does not reach the tool: stub the HTTP client, or test `defineTool` with a spec of the test's own
- The WWDC tests read the bundled data in `data/wwdc`

### Calling Tools

`connectClient()` from `mocks/tool-client.ts` returns an MCP client linked to the server in memory.
`callTool()` and `textOf()` call one tool and read the text of its result.

### Test Data

- Shared test data is defined in `helpers/test-helpers.ts`, and larger fixtures in the `*-fixtures.ts` file next to the tests that use them
- Mock responses match the structure of Apple's responses

## Adding New Tests

1. Add unit tests for the use case
2. Add or update the server tests if the change alters the MCP interface
3. Add a regression test for each bug you fix, and check that it fails without the fix
4. Run `just verify` before committing
