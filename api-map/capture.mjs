// Records developer.apple.com/search's calls to Apple's search API into search.har, for mitmproxy2swagger.
// Runs the installed Google Chrome (channel 'chrome'), so no Playwright browser download is needed.
import { join } from "node:path";
import { chromium } from "playwright";

const SEARCH = "https://developer.apple.com/search/?q=";
// A plain query, a question the page answers with Apple's AI answer, then the page's four filters on the last one.
const QUERIES = ["tab bars", "how do I show a popover tip with TipKit"];
const FILTERS = ["documentation", "video", "sample_code", "wwdc26"];

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  recordHar: {
    path: join(import.meta.dir, "search.har"),
    urlFilter: /devintserv\.msc\.sbz\.apple\.com/,
  },
});
const page = await context.newPage();

// Each step waits for its query request. Only requests are mapped: the page aborts its own streams (a new search
// cancels the last, an idle timer the rest), so Chrome never reports a response as finished.
async function query(action) {
  const request = page.waitForRequest("**/api/v1/query");
  await action();
  await request;
}

try {
  for (const text of QUERIES) {
    await query(() => page.goto(SEARCH + encodeURIComponent(text)));
  }
  // The page opens on its AI answer; the filters sit on the search tab.
  await page.click("#top-tab-search");
  for (const filter of FILTERS) {
    await query(() =>
      page.click(`.tn-item[data-filter-type="${filter}"] .tn-link`),
    );
  }
} finally {
  // Closing the context is what writes the HAR, so it runs even when a step fails.
  await context.close();
  await browser.close();
}
