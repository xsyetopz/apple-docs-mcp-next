import { type Mock, spyOn } from "bun:test";

import { httpClient } from "../../src/core/http-client.ts";

type HttpClientSpies = {
	[Method in keyof typeof httpClient]: Mock<(typeof httpClient)[Method]>;
};

const unmocked = (method: string): Error =>
	new Error(`httpClient.${method} was called without a mocked answer`);

/**
 * Replaces every method of `httpClient` until the test ends. Each one rejects until the test gives it an answer,
 * so a request the test did not expect fails by name. Call it in `beforeEach` or in a test.
 */
export const spyOnHttpClient = (): HttpClientSpies => ({
	get: spyOn(httpClient, "get").mockRejectedValue(unmocked("get")),
	getJson: spyOn(httpClient, "getJson").mockRejectedValue(unmocked("getJson")),
	getText: spyOn(httpClient, "getText").mockRejectedValue(unmocked("getText")),
	postText: spyOn(httpClient, "postText").mockRejectedValue(
		unmocked("postText"),
	),
});
