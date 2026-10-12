import { afterEach, beforeEach, mock } from "bun:test";

/**
 * Preload for every test file, set in bunfig.toml.
 * It runs before the test files, so the module mocks here apply to all of them.
 */

declare global {
  // Helpers that the tests can call to build a fetch response or a fetch failure.
  var createMockResponse: (data: unknown, status?: number) => Promise<Response>;
  var createMockError: (message: string) => Promise<never>;
}

// Set test environment
process.env.NODE_ENV = "test";

// Mock the path module to avoid import.meta.url issues
mock.module("../src/wwdc/data-source-path.ts", () => ({
  getWWDCDataDirectory: mock(() => "/mock/data/wwdc"),
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = mock();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Mock fetch for tests
globalThis.fetch = Object.assign(mock<typeof fetch>(), {
  preconnect: () => {},
});

globalThis.createMockResponse = (data, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(data),
    text: () =>
      Promise.resolve(typeof data === "string" ? data : JSON.stringify(data)),
  } as Response);
};

globalThis.createMockError = (message) => {
  return Promise.reject(new Error(message));
};
