export const hasText = (value: string | undefined): value is string =>
	value !== undefined && value !== "";
