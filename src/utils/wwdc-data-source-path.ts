/**
 * Separate module for handling data directory path resolution
 * This is isolated to avoid import.meta.url issues in tests
 */

import path from "node:path";

/**
 * Get the WWDC data directory path
 */
export function getWWDCDataDirectory(): string {
  // In test environment, use current working directory
  if (process.env.NODE_ENV === "test") {
    return path.resolve(process.cwd(), "data/wwdc");
  }

  // The source runs in place: this file is in src/utils/, so the bundled
  // data at the package root is at ../../data
  return path.resolve(import.meta.dir, "../../data/wwdc");
}
