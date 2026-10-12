/**
 * Where the bundled WWDC data is, in a module of its own so that a test can point the data source elsewhere.
 */
import path from "node:path";

/** The package runs from its source, so the data at the package root is two folders up from `src/wwdc/` */
export function getWWDCDataDirectory(): string {
  return path.resolve(import.meta.dir, "../../data/wwdc");
}
