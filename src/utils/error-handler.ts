/**
 * Unified error handling utilities
 */

import type { AppError, ErrorResponse } from "../types/error.ts";
import { ErrorType } from "../types/error.ts";
import { ERROR_MESSAGES } from "./constants.ts";
import { logger } from "./logger.ts";

// Re-export for backward compatibility
export type { AppError };
export { ErrorType };

const ERROR_TYPES: readonly unknown[] = Object.values(ErrorType);

/**
 * Whether a caught value has the shape of an AppError: an ErrorType and a message
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    ERROR_TYPES.includes(error.type) &&
    "message" in error &&
    typeof error.message === "string"
  );
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: AppError): ErrorResponse {
  let message = `Error: ${error.message}`;

  if (error.suggestions && error.suggestions.length > 0) {
    message += `\n\nSuggestions:\n${error.suggestions.map((s) => `• ${s}`).join("\n")}`;
  }

  return {
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
    isError: true,
  };
}

/**
 * Handle fetch errors with specific error types
 */
export function handleFetchError(error: unknown, url: string): AppError {
  if (error instanceof TypeError) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: ERROR_MESSAGES.NETWORK_ERROR,
      originalError: error,
      suggestions: [
        "Check your internet connection",
        "Verify the URL is accessible",
        "Try again in a few moments",
      ],
    };
  }

  if (error instanceof Error) {
    if (error.message.includes("timeout")) {
      return {
        type: ErrorType.TIMEOUT,
        message: ERROR_MESSAGES.TIMEOUT,
        originalError: error,
        suggestions: [
          "Try again with a simpler query",
          "Check your network connection",
        ],
      };
    }

    if (error.message.includes("404")) {
      return {
        type: ErrorType.NOT_FOUND,
        message: ERROR_MESSAGES.NOT_FOUND,
        originalError: error,
        suggestions: [
          "Search for the topic in Apple Developer Documentation",
          "Check if this is an outdated link",
          `Visit the original URL directly: ${url}`,
        ],
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      message: error.message,
      originalError: error,
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: String(error),
  };
}

/**
 * Handle JSON parsing errors
 */
export function handleParseError(error: unknown): AppError {
  return {
    type: ErrorType.PARSE_ERROR,
    message: ERROR_MESSAGES.PARSE_FAILED,
    originalError: error instanceof Error ? error : undefined,
    suggestions: [
      "The API response format may have changed",
      "Try again later",
      "Report this issue if it persists",
    ],
  };
}

/**
 * Validate input parameters
 */
export function validateInput(
  value: string,
  fieldName: string,
  minLength: number = 1,
): AppError | null {
  if (!value || value.trim().length < minLength) {
    return {
      type: ErrorType.INVALID_INPUT,
      message: `${fieldName} is required and must be at least ${minLength} character(s)`,
      suggestions: [
        `Provide a valid ${fieldName.toLowerCase()}`,
        "Check the parameter format",
      ],
    };
  }
  return null;
}

/**
 * Log error for debugging (only in development)
 */
export function logError(error: AppError, context?: string): void {
  if (process.env.NODE_ENV === "development") {
    logger.error(
      `[${context ?? "ERROR"}] ${error.message}`,
      error.originalError,
    );
  }
}

/**
 * Handle generic errors and convert them to AppError
 */
export function handleGenericError(
  error: unknown,
  context: string,
  fallbackMessage?: string,
): AppError {
  logger.error(`Error in ${context}:`, error);

  if (error instanceof Error) {
    // Check for specific error types
    if (
      error.message.includes("timeout") ||
      error.message.includes("ETIMEDOUT")
    ) {
      return {
        type: ErrorType.TIMEOUT,
        message: ERROR_MESSAGES.TIMEOUT,
        originalError: error,
        suggestions: [
          "Try again with a simpler query",
          "Check your network connection",
          "Verify the service is available",
        ],
      };
    }

    if (error.message.includes("429") || error.message.includes("rate limit")) {
      return {
        type: ErrorType.RATE_LIMITED,
        message: "Request rate limit exceeded",
        originalError: error,
        suggestions: [
          "Wait a moment before trying again",
          "Consider reducing the frequency of requests",
        ],
      };
    }

    if (
      error.message.includes("500") ||
      error.message.includes("502") ||
      error.message.includes("503")
    ) {
      return {
        type: ErrorType.SERVICE_UNAVAILABLE,
        message:
          "Apple Developer Documentation service is temporarily unavailable",
        originalError: error,
        suggestions: [
          "Try again in a few minutes",
          "Check Apple Developer status page",
          "Verify your internet connection",
        ],
      };
    }

    if (error.message.includes("JSON") || error.message.includes("parse")) {
      return handleParseError(error);
    }

    return {
      type: ErrorType.API_ERROR,
      message: error.message,
      originalError: error,
      suggestions: [
        "Check the request parameters",
        "Try again later",
        "Verify the API endpoint is correct",
      ],
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: fallbackMessage || `An error occurred in ${context}`,
    suggestions: [
      "Try again later",
      "Check your input parameters",
      "Contact support if the issue persists",
    ],
  };
}

/**
 * Create a standardized error response with consistent formatting
 */
export function createStandardErrorResponse(
  error: unknown,
  operation: string,
): ErrorResponse {
  const appError = handleGenericError(error, operation);
  return createErrorResponse(appError);
}
