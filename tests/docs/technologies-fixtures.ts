const DOC = "doc://com.apple.documentation/documentation";

export const tech = (
	title: string,
	slug: string,
	languages: string[],
	tags: string[] = [],
): unknown => ({
	title,
	tags,
	languages,
	destination: { identifier: `${DOC}/${slug}` },
});

export const group = (name: string, technologies: unknown[]): unknown => ({
	name,
	technologies,
});

export const betaReference = (slug: string): unknown => ({
	identifier: `${DOC}/${slug}`,
	beta: true,
});

export const technologiesPage = (
	groups: unknown[],
	references: Record<string, unknown> = {},
): unknown => ({
	references,
	sections: [{ kind: "technologies", groups }],
});

export const betaReferences = (slug: string): Record<string, unknown> => ({
	[`${DOC}/${slug}`]: betaReference(slug),
});
