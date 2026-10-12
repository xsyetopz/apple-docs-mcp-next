/**
 * Every request to Apple: fetch with a Safari's headers, retried with backoff by p-retry, paced by Bottleneck.
 */
import Bottleneck from "bottleneck";
import { HeaderGenerator } from "header-generator";
import pRetry, { AbortError } from "p-retry";

import type { AppError, ErrorType } from "../types/error.ts";
import { RATE_LIMIT, REQUEST_CONFIG } from "./constants.ts";
import { handleFetchError } from "./error-handler.ts";
import { logger } from "./logger.ts";

interface RequestOptions {
  timeout?: number;
  retries?: number;
  /** Paces this request instead of the shared limit */
  limiter?: Bottleneck;
}

/** Safari on a Mac, drawn from header-generator's model of real browser traffic: a new set for each request */
const headerGenerator = new HeaderGenerator({
  browsers: ["safari"],
  operatingSystems: ["macos"],
  devices: ["desktop"],
  locales: ["en-US", "en"],
  httpVersion: "1",
});

/** A fresh Safari header set, with the request's own headers (its Accept, its Content-Type) in place of the generated ones */
function browserHeaders(own: HeadersInit | undefined): Headers {
  const headers = new Headers(headerGenerator.getHeaders());
  for (const [name, value] of new Headers(own)) {
    headers.set(name, value);
  }
  return headers;
}

/** At most `MAX_REQUESTS_PER_MINUTE` requests a minute; past that, requests wait their turn */
const limiter = new Bottleneck({
  reservoir: RATE_LIMIT.MAX_REQUESTS_PER_MINUTE,
  reservoirRefreshAmount: RATE_LIMIT.MAX_REQUESTS_PER_MINUTE,
  reservoirRefreshInterval: RATE_LIMIT.WINDOW_MS,
});

/** An answer that is not 2xx: the request, and the status Apple answered it with */
class HttpStatusError extends Error {
  readonly method: string;
  readonly url: string;
  readonly status: number;
  readonly statusText: string;

  constructor(method: string, url: string, status: number, statusText: string) {
    super(`${method} ${url}: HTTP ${status} ${statusText}`);
    this.name = "HttpStatusError";
    this.method = method;
    this.url = url;
    this.status = status;
    this.statusText = statusText;
  }
}

/** A request that failed for good: an Error, so every caller reads its message, with an AppError's kind and suggestions */
export class RequestError extends Error implements AppError {
  readonly type: ErrorType;
  readonly originalError?: Error | undefined;
  readonly suggestions?: string[] | undefined;

  constructor({ type, message, originalError, suggestions }: AppError) {
    super(message, { cause: originalError });
    this.name = "RequestError";
    this.type = type;
    this.originalError = originalError;
    this.suggestions = suggestions;
  }
}

/**
 * One request, its body read by `read` inside the attempt. Each attempt has its own timeout: Apple ends a search's
 * stream once its results are ready, so the timeout only catches a request that hangs. Network errors, timeouts and
 * 5xx answers retry with backoff, a warning each; any other status fails at once.
 */
async function request<T>(
  url: string,
  init: RequestInit,
  read: (response: Response) => Promise<T>,
  options: RequestOptions | undefined,
): Promise<T> {
  const method = init.method ?? "GET";
  try {
    return await pRetry(
      async () => {
        const response = await (options?.limiter ?? limiter).schedule(() =>
          fetch(url, {
            ...init,
            headers: browserHeaders(init.headers),
            signal: AbortSignal.timeout(
              options?.timeout ?? REQUEST_CONFIG.TIMEOUT,
            ),
          }),
        );
        if (!response.ok) {
          const error = new HttpStatusError(
            method,
            url,
            response.status,
            response.statusText,
          );
          throw response.status >= 500 ? error : new AbortError(error);
        }
        return await read(response);
      },
      {
        retries: options?.retries ?? REQUEST_CONFIG.MAX_RETRIES,
        minTimeout: REQUEST_CONFIG.RETRY_DELAY,
        onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
          if (retriesLeft > 0) {
            logger.warn("Request failed, retrying", {
              method,
              url,
              attempt: attemptNumber,
              retriesLeft,
              error: error.message,
            });
          }
        },
      },
    );
  } catch (error) {
    throw new RequestError(handleFetchError(error, url));
  }
}

export const httpClient = {
  /** The response, its body left for the caller to read */
  get: (url: string, options?: RequestOptions): Promise<Response> =>
    request(url, {}, async (response) => response, options),

  getJson: <T>(url: string, options?: RequestOptions): Promise<T> =>
    request(url, {}, async (response) => (await response.json()) as T, options),

  getText: (url: string, options?: RequestOptions): Promise<string> =>
    request(url, {}, (response) => response.text(), options),

  /** A POST with a JSON body, read to the end: a search's stream ends once its results are ready */
  postText: (
    url: string,
    body: unknown,
    accept: string,
    options?: RequestOptions,
  ): Promise<string> =>
    request(
      url,
      {
        method: "POST",
        headers: { Accept: accept, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      (response) => response.text(),
      options,
    ),
};
