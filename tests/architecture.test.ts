/**
 * The layers of src/ and the direction of their imports: main → server → tools → docs and wwdc → core and types. Only
 * the MCP side (tools, server, main) knows the MCP SDK.
 */
import { describe, expect, it } from "bun:test";
import path from "node:path";

const SRC = path.resolve(import.meta.dir, "../src");

const ALLOWED: ReadonlyMap<string, readonly string[]> = new Map([
	["main", ["server", "core"]],
	["server", ["tools"]],
	["tools", ["docs", "wwdc", "core"]],
	["docs", ["core", "types"]],
	["wwdc", ["core", "types"]],
	["core", []],
	["types", []],
]);

const MCP_LAYERS: ReadonlySet<string> = new Set(["main", "server", "tools"]);

const layerOf = (file: string): string => {
	const [first = ""] = path.relative(SRC, file).split(path.sep);
	return first.replace(/\.ts$/u, "");
};

const importsOf = async (file: string): Promise<string[]> => {
	const source = await Bun.file(file).text();
	return [...source.matchAll(/(?:from|import)\s*\(?\s*"([^"]+)"/gu)].map(
		([, specifier = ""]) => specifier,
	);
};

const files = await Array.fromAsync(
	new Bun.Glob("**/*.ts").scan({ cwd: SRC, absolute: true }),
);

const sources = await Promise.all(
	files.map(async (file) => ({ file, specifiers: await importsOf(file) })),
);

const crossesLayers = (file: string, specifier: string): boolean => {
	const target = path.resolve(path.dirname(file), specifier);
	const layer = layerOf(file);
	const targetLayer = layerOf(target);
	return (
		specifier.startsWith(".") &&
		target.startsWith(SRC) &&
		targetLayer !== layer &&
		ALLOWED.get(layer)?.includes(targetLayer) !== true
	);
};

const inwardViolations = (): string[] =>
	sources.flatMap(({ file, specifiers }) =>
		specifiers
			.filter((specifier) => crossesLayers(file, specifier))
			.map((specifier) => `${path.relative(SRC, file)} → ${specifier}`),
	);

const sdkViolations = (): string[] =>
	sources
		.filter(({ file }) => !MCP_LAYERS.has(layerOf(file)))
		.flatMap(({ file, specifiers }) =>
			specifiers
				.filter((specifier) => specifier.startsWith("@modelcontextprotocol/"))
				.map((specifier) => `${path.relative(SRC, file)} → ${specifier}`),
		);

describe("the architecture", () => {
	it("knows the layer of every source file", () => {
		expect(
			files.map((file) => layerOf(file)).filter((layer) => !ALLOWED.has(layer)),
		).toEqual([]);
	});

	it("imports only inward, from a layer to its own files or the layers below it", () => {
		expect(inwardViolations()).toEqual([]);
	});

	it("keeps the MCP SDK on the MCP side", () => {
		expect(sdkViolations()).toEqual([]);
	});
});
