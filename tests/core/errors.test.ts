/**
 * How a failure is named: its kind from the error itself, with what to try instead.
 */
import { describe, expect, it, spyOn } from "bun:test";

import {
  AppError,
  classifyError,
  classifyFetchError,
  ErrorType,
  requireText,
} from "../../src/core/errors.ts";
import { logger } from "../../src/core/logger.ts";

describe("errors", () => {
  it("names a failed fetch by what went wrong", () => {
    expect(
      classifyFetchError(
        new TypeError("fetch failed"),
        "https://developer.apple.com/x",
      ).type,
    ).toBe(ErrorType.NETWORK_ERROR);
    expect(
      classifyFetchError(
        new Error("The operation was aborted due to timeout"),
        "u",
      ).type,
    ).toBe(ErrorType.TIMEOUT);
    expect(
      classifyFetchError(new Error("GET u: HTTP 404 Not Found"), "u").type,
    ).toBe(ErrorType.NOT_FOUND);
    expect(classifyFetchError("odd", "u")).toMatchObject({
      type: ErrorType.UNKNOWN,
      message: "odd",
    });
  });

  it("keeps a failure's kind and suggestions on the Error it throws", () => {
    const error = classifyFetchError(
      new Error("GET u: HTTP 404 Not Found"),
      "u",
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error.suggestions).toContain("Visit the original URL directly: u");
  });

  it("tells a busy service from a rate limit", () => {
    spyOn(logger, "error").mockImplementation(() => {});

    expect(classifyError(new Error("HTTP 503"), "search").type).toBe(
      ErrorType.SERVICE_UNAVAILABLE,
    );
    expect(classifyError(new Error("HTTP 429"), "search").type).toBe(
      ErrorType.RATE_LIMITED,
    );
  });

  it("refuses an empty or blank input, and passes a real one", () => {
    expect(() => requireText("  ", "Search query")).toThrow(
      expect.objectContaining({ type: ErrorType.INVALID_INPUT }),
    );
    expect(() => requireText("NavigationStack", "Search query")).not.toThrow();
  });
});
