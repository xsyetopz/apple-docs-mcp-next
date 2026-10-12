/**
 * The layers of src/ and the direction of their imports: main → server → tools → docs and wwdc → core and types. Only
 * the MCP side (tools, server, main) knows the MCP SDK.
 */
import { describe, expect, it } from "bun:test";
import path from "node:path";

const SRC = path.resolve(import.meta.dir, "../src");

type Layer = "main" | "server" | "tools" | "docs" | "wwdc" | "core" | "types";

const ALLOWED: Record<Layer, readonly Layer[]> = {
  main: ["server", "core"],
  server: ["tools"],
  tools: ["docs", "wwdc", "core"],
  docs: ["core", "types"],
  wwdc: ["core", "types"],
  core: [],
  types: [],
};

const MCP_LAYERS: readonly Layer[] = ["main", "server", "tools"];

function layerOf(file: string): Layer {
  const [first = ""] = path.relative(SRC, file).split(path.sep);
  return first.replace(/\.ts$/, "") as Layer;
}

async function imports(file: string): Promise<string[]> {
  const source = await Bun.file(file).text();
  return [...source.matchAll(/(?:from|import)\s*\(?\s*"([^"]+)"/g)].map(
    ([, specifier = ""]) => specifier,
  );
}

const files = await Array.fromAsync(
  new Bun.Glob("**/*.ts").scan({ cwd: SRC, absolute: true }),
);

describe("the architecture", () => {
  it("knows the layer of every source file", () => {
    for (const file of files) {
      expect(Object.keys(ALLOWED)).toContain(layerOf(file));
    }
  });

  it("imports only inward, from a layer to its own files or the layers below it", async () => {
    const violations: string[] = [];
    for (const file of files) {
      const layer = layerOf(file);
      for (const specifier of await imports(file)) {
        if (!specifier.startsWith(".")) {
          continue;
        }
        const target = path.resolve(path.dirname(file), specifier);
        if (!target.startsWith(SRC)) {
          continue;
        }
        const targetLayer = layerOf(target);
        if (targetLayer !== layer && !ALLOWED[layer].includes(targetLayer)) {
          violations.push(`${path.relative(SRC, file)} → ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps the MCP SDK on the MCP side", async () => {
    const violations: string[] = [];
    for (const file of files) {
      if (MCP_LAYERS.includes(layerOf(file))) {
        continue;
      }
      for (const specifier of await imports(file)) {
        if (specifier.startsWith("@modelcontextprotocol/")) {
          violations.push(`${path.relative(SRC, file)} → ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
