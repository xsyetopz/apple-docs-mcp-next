/**
 * Error handling types
 */

/**
 * Application error types
 */
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

/**
 * Application error structure
 */
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error | undefined;
  suggestions?: string[] | undefined;
}

/**
 * MCP Error response structure
 */
export interface ErrorResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError: boolean;
}
