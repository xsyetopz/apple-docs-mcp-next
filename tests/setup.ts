/**
 * Preload for every test file, set in bunfig.toml. The test files share one process, so a test replaces a function
 * with `spyOn` inside `beforeEach` or the test itself, and the `afterEach` here puts every original back.
 */
import { afterEach, beforeEach, mock, spyOn } from "bun:test";

beforeEach(() => {
	spyOn(console, "error").mockImplementation(mock());
	spyOn(globalThis, "fetch").mockRejectedValue(
		new Error("tests/setup.ts: this test called fetch without mocking it"),
	);
});

afterEach(() => {
	mock.restore();
});
