/**
 * The videos on one WWDC topic page, for scripts/add-wwdc-year.ts
 */

import { WWDC_URLS } from "../../core/constants.ts";
import { logger } from "../../core/logger.ts";
import { fetchVideosPage } from "./content-extractor.ts";

interface TopicVideo {
  id: string;
  year: string;
  title: string;
  duration: string;
  description?: string | undefined;
  thumbnail?: string | undefined;
  url: string;
}

/**
 * Extract all videos on a topic's page, by its link (the `url` of a topic in the data's index.json)
 */
export async function extractTopicVideos(url: string): Promise<TopicVideo[]> {
  logger.info("Extracting the videos of a topic page", { url });

  try {
    const document = await fetchVideosPage(url);

    const videos: TopicVideo[] = [];

    // Find video cards
    const videoCards = document.querySelectorAll('a[href*="/videos/play/"]');

    videoCards.forEach((card: Element) => {
      const href = card.getAttribute("href") || "";
      const match = href.match(/\/videos\/play\/wwdc(\d{4})\/(\d+)\//);

      if (match) {
        // Both groups are required digits, so a match always has them
        const year = match[1] ?? "";
        const id = match[2] ?? "";

        // Extract title
        const titleEl = card.querySelector('h4, .title, [class*="title"]');
        const title = titleEl?.textContent?.trim() || "";

        // Extract duration
        const durationEl = card.querySelector(
          '.video-duration, [class*="duration"], time',
        );
        const duration = durationEl?.textContent?.trim() || "";

        // Extract description
        const descEl = card.querySelector(
          'p, .description, [class*="description"]',
        );
        const description = descEl?.textContent?.trim();

        // Extract thumbnail
        const imgEl = card.querySelector("img");
        const thumbnail =
          imgEl?.getAttribute("src") ||
          imgEl?.getAttribute("data-src") ||
          undefined;

        if (title) {
          videos.push({
            id,
            year,
            title,
            duration,
            description,
            thumbnail,
            url: `${WWDC_URLS.BASE.replace("/videos", "")}${href}`,
          });
        }
      }
    });

    logger.info(`Found ${videos.length} videos`);
    return videos;
  } catch (error) {
    logger.error("Failed to extract the videos of a topic page", {
      url,
      error,
    });
    throw error;
  }
}
