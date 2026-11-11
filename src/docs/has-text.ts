/**
 * Whether a value is a string with at least one character
 */
export const hasText = (value: string | undefined | null): value is string =>
	value !== undefined && value !== null && value !== "";
