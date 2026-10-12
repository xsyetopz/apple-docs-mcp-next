# Apple Docs MCP Tests

This directory contains the tests for the Apple Docs MCP server.
They use `bun:test`.

## Test Structure

```text
tests/
├── helpers/                   # Shared test data and utility functions
│   └── test-helpers.ts
├── mocks/                     # Mock modules
│   └── http-client.mock.ts
├── core/                      # Tests for src/core: the HTTP client and the errors
├── docs/                      # Tests for the use cases in src/docs
├── wwdc/                      # Tests for the use cases and extractors in src/wwdc
├── architecture.test.ts       # The layers of src/ and the direction of their imports
├── response-format.test.ts    # One text result per tool call, over MCP
├── server.test.ts             # The tools a client lists, each call routed to its use case
└── setup.ts                   # Preload for every test file
```

`tests/setup.ts` is listed in `bunfig.toml` as a preload (`[test] preload`).
It runs before each test file and sets the global mocks: `fetch`, `console.error`, and the WWDC data folder.

## Running Tests

```bash
# Run all tests (bun test --isolate)
bun run test

# Run one test file
bun run test tests/core/http-client.test.ts

# Run with coverage
bun test --isolate --coverage

# Run in watch mode
bun test --isolate --watch
```

`bun run test` runs each test file in its own isolated module state.
Module mocks from one file do not leak into another, so keep `--isolate` when you run the suite.

## Test Coverage Areas

### 1. Unit Tests

- **Tools**: Each tool has tests covering:
  - Normal operation
  - Error handling
  - Edge cases
  - Input validation
  - Cache behavior
- **Utilities**: Error handling, URL conversion, framework mapping, HTTP client, and WWDC data loading

### 2. Server Tests

- **MCP Server**: Server lifecycle and request handling (`index.test.ts`)
- **Response Format**: Every tool returns a well-formed MCP response (`response-format.test.ts`)

### 3. Regression Tests

- **Nested responses**: `getAppleDocContent` must not wrap an MCP response inside another one (`regression/`)

## Key Test Patterns

### Mocking

- HTTP requests are mocked to avoid external dependencies
- Cache is mocked to control test data
- Module mocks use `mock.module` from `bun:test`, and they must be set before the module under test is imported
- File system operations are avoided in tests, except for the bundled WWDC data test

### Test Data

- Shared test data is defined in `helpers/test-helpers.ts`
- Mock responses match actual API response structure

### Assertions

- Tests verify both success and error paths
- Response format is validated
- Edge cases are thoroughly tested

## Adding New Tests

When adding new features:

1. Add unit tests for the core functionality
2. Add or update server tests if the feature changes the MCP interface
3. Add a regression test for each bug you fix, and check that it fails without the fix
4. Ensure `bun run test` passes before committing

## Debugging Tests

To debug failing tests:

1. Run the specific test file with `bun run test <path>`
2. Add `console.log` statements in the test
3. Check mock implementations match actual behavior
