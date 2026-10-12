/**
 * App Store Connect Help: web pages, without Markdown or JSON (2026-10-11). Each page holds its text in an article and
 * carries the whole help's navigation, one option per page with its title and section.
 */
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { tables } from "turndown-plugin-gfm";

import { httpClient } from "../core/http-client.ts";
import { HELP_PATH } from "./search-result-parser.ts";

/** A help page without an article: Apple changed the pages' layout */
class HelpPageLayoutError extends Error {}

/** One page the help's navigation lists */
interface HelpPage {
  url: string;
  title: string;
  section: string;
}

/** Whether a node sits inside a table cell, where a Markdown row has to stay on one line */
const inTableCell = (node: Node): boolean => {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (parent.nodeName === "TD" || parent.nodeName === "TH") {
      return true;
    }
  }
  return false;
};

// Apple's table cells hold paragraphs, lists and figures; inside a cell they become one line
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
})
  .remove(["script", "link", "style"])
  .use(tables)
  .addRule("blocksInTableCells", {
    filter: (node) =>
      ["P", "DIV", "FIGURE", "UL", "OL", "LI", "BR"].includes(node.nodeName) &&
      inTableCell(node),
    replacement: (content, node) =>
      `${node.nodeName === "LI" ? "• " : ""}${content.trim()} `,
  });

/**
 * One help page's article as Markdown, its links and pictures made full against the page's address
 */
export const fetchHelpPage = async (url: string): Promise<string> => {
  const { document } = new JSDOM(await httpClient.getText(url), { url }).window;
  const article = document.querySelector("article");
  if (!article) {
    throw new HelpPageLayoutError(`${url} has no <article>`);
  }
  for (const link of article.querySelectorAll("a[href]")) {
    link.setAttribute(
      "href",
      new URL(link.getAttribute("href") ?? "", url).href,
    );
  }
  // An empty alt marks a decorative image, such as a device icon beside its screenshot sizes
  for (const image of article.querySelectorAll("img")) {
    if (image.getAttribute("alt")) {
      image.setAttribute(
        "src",
        new URL(image.getAttribute("src") ?? "", url).href,
      );
    } else {
      image.remove();
    }
  }
  return turndown.turndown(article.innerHTML);
};

/**
 * Every page the help's navigation lists, read from any one page's HTML
 */
export const helpPagesOf = (html: string, url: string): HelpPage[] => {
  const { document } = new JSDOM(html, { url }).window;
  return [
    ...document.querySelectorAll(
      `li.form-dropdown-option a[href^="${HELP_PATH}"]`,
    ),
  ].map((link) => ({
    url: new URL(link.getAttribute("href") ?? "", url).href.replace(/\/$/, ""),
    title:
      link.querySelector(".form-dropdown-option-title")?.textContent.trim() ??
      "",
    section:
      link.querySelector(".form-dropdown-option-text")?.textContent.trim() ??
      "",
  }));
};
