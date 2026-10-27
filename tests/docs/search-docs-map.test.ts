import { describe, expect, it } from "bun:test";
import { handleSearchDocsMap } from "../../src/docs/search-docs-map.ts";

describe("search_docs_map", () => {
  it("lists a page per line as a link with its kind and technology", async () => {
    const result = await handleSearchDocsMap({
      query: "gauge",
      technology: undefined,
      limit: 5,
    });

    expect(result).toContain('# Docs map: "gauge"');
    expect(result).toMatch(
      /^- \[[^\]]*\]\(https:\/\/developer\.apple\.com\/[^)]*\) · \S+ · .+$/m,
    );
    expect(result).not.toContain("**");
  });

  it("says how many pages the limit cut, with what to do about it", async () => {
    const result = await handleSearchDocsMap({
      query: "view",
      technology: undefined,
      limit: 2,
    });

    expect(result.match(/^- \[/gm)).toHaveLength(2);
    expect(result).toMatch(
      /Showing the 2 shortest of \d+\. Narrow with technology or a longer query, or raise limit\.$/,
    );
  });

  it("does not mention a cap when every page is shown", async () => {
    const result = await handleSearchDocsMap({
      query: "gaugestyleconfiguration.label",
      technology: undefined,
      limit: 50,
    });

    expect(result).not.toContain("Showing");
  });
});
