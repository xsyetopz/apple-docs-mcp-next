// turndown-plugin-gfm ships no types; this declares the one plugin the help page reader uses.
declare module "turndown-plugin-gfm" {
  import type TurndownService from "turndown";

  export const tables: TurndownService.Plugin;
}
