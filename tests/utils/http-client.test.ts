/**
 * The client every request to Apple goes through: fetch, retried with backoff by p-retry, paced by Bottleneck.
 */
import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";

import { httpClient, RequestError } from "../../src/utils/http-client.ts";
import { logger } from "../../src/utils/logger.ts";

const answer = (status: number, body: string) => new Response(body, { status });

describe("httpClient", () => {
  const fetchMock = Object.assign(mock<typeof fetch>(), {
    preconnect: () => {},
  });

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it("retries a server error with a warning, then returns the answer", async () => {
    const warn = spyOn(logger, "warn").mockImplementation(() => {});
    fetchMock
      .mockResolvedValueOnce(answer(503, "busy"))
      .mockResolvedValueOnce(answer(200, '{"ok":true}'));

    await expect(
      httpClient.getJson<{ ok: boolean }>("https://developer.apple.com/x.json"),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      "Request failed, retrying",
      expect.objectContaining({
        method: "GET",
        url: "https://developer.apple.com/x.json",
        attempt: 1,
      }),
    );
    warn.mockRestore();
  });

  it("fails at once on a missing page, with an Error that callers can read", async () => {
    fetchMock.mockResolvedValue(answer(404, "missing"));

    const failure = httpClient.get("https://developer.apple.com/missing.json");

    await expect(failure).rejects.toBeInstanceOf(RequestError);
    await expect(failure).rejects.toMatchObject({
      type: "NOT_FOUND",
      cause: { status: 404, url: "https://developer.apple.com/missing.json" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a network error, and reports it as one when every attempt fails", async () => {
    spyOn(logger, "warn").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      httpClient.get("https://developer.apple.com/x.json", { retries: 1 }),
    ).rejects.toMatchObject({ type: "NETWORK_ERROR" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives each attempt a timeout of its own", async () => {
    spyOn(logger, "warn").mockImplementation(() => {});
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

    await expect(
      httpClient.postText(
        "https://example.com/api",
        { text: "q" },
        "application/jsonl",
      ),
    ).resolves.toBe('{"kind":"searchFinished"}');

    const init = fetchMock.mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe('{"text":"q"}');
    expect(headers.get("User-Agent")).toMatch(
      /Macintosh.* Version\/[\d.]+ Safari\//,
    );
    expect(headers.get("Accept")).toBe("application/jsonl");
  });
});
