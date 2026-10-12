import { describe, expect, it } from "bun:test";
/**
 * Framework names from what a person types, as Apple writes them.
 */
import { normalizeFrameworkName } from "../../src/docs/framework-mapper.ts";

describe("normalizeFrameworkName", () => {
  it("drops case, spaces, dashes and underscores to find the framework", () => {
    for (const typed of [
      "swiftui",
      "SWIFTUI",
      "swift-ui",
      "swift_ui",
      " SwiftUI ",
      "swift ui",
    ]) {
      expect(normalizeFrameworkName(typed)).toBe("SwiftUI");
    }
    expect(normalizeFrameworkName("core-data")).toBe("Core Data");
  });

  it("knows the names that are not a framework's own", () => {
    expect(normalizeFrameworkName("objc")).toBe("Objective-C");
    expect(normalizeFrameworkName("cg")).toBe("Core Graphics");
    expect(normalizeFrameworkName("touch-id")).toBe("Local Authentication");
    expect(normalizeFrameworkName("storekit2")).toBe("StoreKit");
  });

  it("capitalizes a name it does not know, and gives an empty name for none", () => {
    expect(normalizeFrameworkName("someNewKit")).toBe("SomeNewKit");
    expect(normalizeFrameworkName("")).toBe("");
    expect(normalizeFrameworkName(undefined)).toBe("");
  });
});
