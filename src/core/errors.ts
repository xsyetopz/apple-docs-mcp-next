/**
 * The failures a tool reports: each with its kind, a message for the client and what to try instead.
 */
import { ERROR_MESSAGES } from "./constants.ts";
import { logger } from "./logger.ts";

export const ErrorType = {
  NETWORK_ERROR: "NETWORK_ERROR",
  PARSE_ERROR: "PARSE_ERROR",
  NOT_FOUND: "NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  TIMEOUT: "TIMEOUT",
  RATE_LIMITED: "RATE_LIMITED",
  API_ERROR: "API_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  UNKNOWN: "UNKNOWN",
} as const;
export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  cause?: unknown;
  suggestions?: readonly string[];
}

/** A failure the client reads as is: the tool layer shows its message and its suggestions */
export class AppError extends Error {
  readonly type: ErrorType;
  readonly suggestions: readonly string[];

  constructor({ type, message, cause, suggestions = [] }: ErrorDetails) {
    super(message, { cause });
    this.name = "AppError";
    this.type = type;
    this.suggestions = suggestions;
  }
}

/** A request that failed for good, named by what went wrong */
export function classifyFetchError(error: unknown, url: string): AppError {
  if (error instanceof TypeError) {
    return new AppError({
      type: ErrorType.NETWORK_ERROR,
      message: ERROR_MESSAGES.NETWORK_ERROR,
      cause: error,
      suggestions: [
        "Check your internet connection",
        "Verify the URL is accessible",
        "Try again in a few moments",
      ],
    });
  }

  if (!(error instanceof Error)) {
    return new AppError({ type: ErrorType.UNKNOWN, message: String(error) });
  }

  if (error.message.includes("timeout")) {
    return new AppError({
      type: ErrorType.TIMEOUT,
      message: ERROR_MESSAGES.TIMEOUT,
      cause: error,
      suggestions: [
        "Try again with a simpler query",
        "Check your network connection",
      ],
    });
  }

  if (error.message.includes("404")) {
    return new AppError({
      type: ErrorType.NOT_FOUND,
      message: ERROR_MESSAGES.NOT_FOUND,
      cause: error,
      suggestions: [
        "Search for the topic in Apple Developer Documentation",
        "Check if this is an outdated link",
        `Visit the original URL directly: ${url}`,
      ],
    });
  }

  return new AppError({
    type: ErrorType.UNKNOWN,
    message: error.message,
    cause: error,
  });
}

/** Any other failure of the tool named `context`, logged and named by its message */
export function classifyError(error: unknown, context: string): AppError {
  logger.error(`Error in ${context}:`, error);

  if (!(error instanceof Error)) {
    return new AppError({
      type: ErrorType.UNKNOWN,
      message: `An error occurred in ${context}`,
      suggestions: [
        "Try again later",
        "Check your input parameters",
        "Contact support if the issue persists",
      ],
    });
  }

  const { message } = error;
  if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
    return new AppError({
      type: ErrorType.TIMEOUT,
      message: ERROR_MESSAGES.TIMEOUT,
      cause: error,
      suggestions: [
        "Try again with a simpler query",
        "Check your network connection",
        "Verify the service is available",
      ],
    });
  }

  if (message.includes("429") || message.includes("rate limit")) {
    return new AppError({
      type: ErrorType.RATE_LIMITED,
      message: "Request rate limit exceeded",
      cause: error,
      suggestions: [
        "Wait a moment before trying again",
        "Consider reducing the frequency of requests",
      ],
    });
  }

  if (["500", "502", "503"].some((status) => message.includes(status))) {
    return new AppError({
      type: ErrorType.SERVICE_UNAVAILABLE,
      message:
        "Apple Developer Documentation service is temporarily unavailable",
      cause: error,
      suggestions: [
        "Try again in a few minutes",
        "Check Apple Developer status page",
        "Verify your internet connection",
      ],
    });
  }

  if (message.includes("JSON") || message.includes("parse")) {
    return new AppError({
      type: ErrorType.PARSE_ERROR,
      message: ERROR_MESSAGES.PARSE_FAILED,
      cause: error,
      suggestions: [
        "The API response format may have changed",
        "Try again later",
        "Report this issue if it persists",
      ],
    });
  }

  return new AppError({
    type: ErrorType.API_ERROR,
    message,
    cause: error,
    suggestions: [
      "Check the request parameters",
      "Try again later",
      "Verify the API endpoint is correct",
    ],
  });
}

/** Throws an INVALID_INPUT error when `value` is empty or blank */
export function requireText(value: string, fieldName: string): void {
  if (value.trim().length === 0) {
    throw new AppError({
      type: ErrorType.INVALID_INPUT,
      message: `${fieldName} is required and must be at least 1 character(s)`,
      suggestions: [
        `Provide a valid ${fieldName.toLowerCase()}`,
        "Check the parameter format",
      ],
    });
  }
}
