/**
 * The references embedded in one page's JSON: its pages, not its images, each summary as Apple wrote it.
 */
import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
import { httpClient } from "../../src/core/http-client.ts";
import { handleResolveReferencesBatch } from "../../src/docs/resolve-references-batch.ts";

describe("resolve_references_batch", () => {
  afterEach(() => {
    mock.restore();
  });

  it("lists the pages a page references, not its images, keeping code names in summaries", async () => {
    spyOn(httpClient, "getJson").mockResolvedValue({
      metadata: { title: "NavigationStack" },
      references: {
        "SwiftUI-PageImage-card.png": {
          type: "image",
          identifier: "SwiftUI-PageImage-card.png",
          variants: [],
        },
        "doc://SwiftUI/Binding": {
          type: "topic",
          kind: "symbol",
          role: "symbol",
          title: "Binding",
          url: "/documentation/swiftui/binding",
          abstract: [
            { type: "text", text: "Reads and writes a value owned by a " },
            { type: "codeVoice", code: "State" },
            { type: "text", text: "." },
          ],
        },
      },
    });

    const result = await handleResolveReferencesBatch({
      sourceUrl:
        "https://developer.apple.com/documentation/swiftui/navigationstack",
      maxReferences: 5,
      filterByType: "all",
    });

    expect(result).not.toContain("Unknown");
    expect(result).toContain("1 references");
    expect(result).toContain("Reads and writes a value owned by a `State`.");
    expect(result).toContain(
      "- [Binding](https://developer.apple.com/documentation/swiftui/binding): Reads and writes",
    );
    expect(result).not.toContain("Kind:");
    expect(result).not.toContain("Showing");
  });

  it("prints a declaration on the item's line and says when maxReferences cut the list", async () => {
    const reference = (name: string) => ({
      type: "topic",
      kind: "symbol",
      role: "symbol",
      title: name,
      url: `/documentation/swiftui/${name.toLowerCase()}`,
      fragments: [
        { kind: "keyword", text: "struct" },
        { kind: "text", text: " " },
        { kind: "identifier", text: name },
      ],
      abstract: [{ type: "text", text: `The ${name}.` }],
    });
    spyOn(httpClient, "getJson").mockResolvedValue({
      metadata: { title: "View" },
      references: {
        "doc://SwiftUI/A": reference("Alpha"),
        "doc://SwiftUI/B": reference("Beta"),
        "doc://SwiftUI/C": reference("Gamma"),
      },
    });

    const result = await handleResolveReferencesBatch({
      sourceUrl: "https://developer.apple.com/documentation/swiftui/view",
      maxReferences: 2,
      filterByType: "all",
    });

    expect(result).toContain(
      "- [Alpha](https://developer.apple.com/documentation/swiftui/alpha) `struct Alpha`: The Alpha.",
    );
    expect(result).not.toContain("Gamma");
    expect(result).toContain(
      "Showing 2 of 3. Narrow with filter, or raise limit.",
    );
  });
});
