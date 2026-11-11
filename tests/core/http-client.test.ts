/**
 * The client every request to Apple goes through: fetch, retried with backoff by p-retry, paced by Bottleneck.
 */
import {
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	mock,
	spyOn,
} from "bun:test";

import { AppError } from "../../src/core/errors.ts";
import { httpClient } from "../../src/core/http-client.ts";
import { logger } from "../../src/core/logger.ts";

const answer = (status: number, body: string): Response =>
	new Response(body, { status });

describe("httpClient", () => {
	let fetchMock: Mock<typeof fetch>;
	let warn: Mock<typeof logger.warn>;

	beforeEach(() => {
		fetchMock = spyOn(globalThis, "fetch");
		warn = spyOn(logger, "warn").mockImplementation(mock());
	});

	it("retries a server error with a warning, then returns the answer", async () => {
		fetchMock
			.mockResolvedValueOnce(answer(503, "busy"))
			.mockResolvedValueOnce(answer(200, '{"ok":true}'));

		const json = await httpClient.getJson("https://developer.apple.com/x.json");

		expect(json).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(warn).toHaveBeenCalledWith(
			"Request failed, retrying",
			expect.objectContaining({
				method: "GET",
				url: "https://developer.apple.com/x.json",
				attempt: 1,
			}),
		);
	});

	it("fails at once on a missing page, with an Error that callers can read", async () => {
		fetchMock.mockResolvedValue(answer(404, "missing"));

		const failure = await httpClient
			.get("https://developer.apple.com/missing.json")
			.catch((error: unknown) => error);

		expect(failure).toBeInstanceOf(AppError);
		expect(failure).toMatchObject({
			type: "NOT_FOUND",
			cause: { status: 404, url: "https://developer.apple.com/missing.json" },
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("retries a network error, and reports it as one when every attempt fails", async () => {
		fetchMock.mockRejectedValue(new TypeError("fetch failed"));

		const failure = await httpClient
			.get("https://developer.apple.com/x.json", { retries: 1 })
			.catch((error: unknown) => error);

		expect(failure).toMatchObject({ type: "NETWORK_ERROR" });

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("gives each attempt a timeout of its own", async () => {
		fetchMock
			.mockResolvedValueOnce(answer(500, "x"))
			.mockResolvedValueOnce(answer(200, "done"));

		await httpClient.postText(
			"https://example.com/api",
			{ text: "q" },
			"application/jsonl",
		);

		const [first, second] = fetchMock.mock.calls.map(
			([, init]) => init?.signal,
		);
		expect(first).toBeDefined();
		expect(second).not.toBe(first);
	});

	it("sends Safari headers with its own Accept, and a search its JSON body", async () => {
		fetchMock.mockResolvedValue(answer(200, '{"kind":"searchFinished"}'));

		const text = await httpClient.postText(
			"https://example.com/api",
			{ text: "q" },
			"application/jsonl",
		);

		expect(text).toBe('{"kind":"searchFinished"}');
		const init = fetchMock.mock.calls[0]?.[1];
		const headers = new Headers(init?.headers);
		expect(init?.method).toBe("POST");
		expect(init?.body).toBe('{"text":"q"}');
		expect(headers.get("User-Agent")).toMatch(
			/Macintosh.* Version\/[\d.]+ Safari\//u,
		);
		expect(headers.get("Accept")).toBe("application/jsonl");
	});
});
