/**
 * How a failure reaches the client: its kind from the error itself, then one error response.
 */
import { describe, expect, it, spyOn } from "bun:test";

import { ErrorType } from "../../src/core/error.ts";
import {
  createErrorResponse,
  handleFetchError,
  handleGenericError,
  validateInput,
} from "../../src/core/error-handler.ts";
import { logger } from "../../src/core/logger.ts";

describe("error handler", () => {
  it("names a failed fetch by what went wrong", () => {
    expect(
      handleFetchError(
        new TypeError("fetch failed"),
        "https://developer.apple.com/x",
      ).type,
    ).toBe(ErrorType.NETWORK_ERROR);
    expect(
      handleFetchError(
        new Error("The operation was aborted due to timeout"),
        "u",
      ).type,
    ).toBe(ErrorType.TIMEOUT);
    expect(
      handleFetchError(new Error("GET u: HTTP 404 Not Found"), "u").type,
    ).toBe(ErrorType.NOT_FOUND);
    expect(handleFetchError("odd", "u")).toEqual({
      type: ErrorType.UNKNOWN,
      message: "odd",
    });
  });

  it("tells a busy service from a rate limit", () => {
    spyOn(logger, "error").mockImplementation(() => {});

    expect(handleGenericError(new Error("HTTP 503"), "search").type).toBe(
      ErrorType.SERVICE_UNAVAILABLE,
    );
    expect(handleGenericError(new Error("HTTP 429"), "search").type).toBe(
      ErrorType.RATE_LIMITED,
    );
  });

  it("turns an error into one text response that says it failed, its suggestions as a list", () => {
    const response = createErrorResponse({
      type: ErrorType.NOT_FOUND,
      message: "Gone",
      suggestions: ["Search first"],
    });

    expect(response).toEqual({
      content: [
        { type: "text", text: "Error: Gone\n\nSuggestions:\n• Search first" },
      ],
      isError: true,
    });
  });

  it("refuses an empty or blank input, and passes a real one", () => {
    expect(validateInput("  ", "Search query")?.type).toBe(
      ErrorType.INVALID_INPUT,
    );
    expect(validateInput("NavigationStack", "Search query")).toBeNull();
  });
});
