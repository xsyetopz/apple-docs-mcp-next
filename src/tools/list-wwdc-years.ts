import { z } from "zod";

import { handleListWWDCYears } from "../wwdc/list-wwdc-years.ts";
import { defineTool } from "./define-tool.ts";

export const listWwdcYearsTool = defineTool({
  name: "list_wwdc_years",
  title: "List WWDC Years",
  description:
    "The WWDC years in the bundled data, each with its session count, plus the total and how many sessions have code and transcripts.",
  inputSchema: z.object({}),
  run: handleListWWDCYears,
});
