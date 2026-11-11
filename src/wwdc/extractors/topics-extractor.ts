/**
 * The videos on one WWDC topic page, for scripts/add-wwdc-year.ts
 */

import { WWDC_URLS } from "../../core/constants.ts";
import { logger } from "../../core/logger.ts";
import { fetchVideosPage } from "./content-extractor.ts";
import { firstNonEmpty } from "./dom.ts";

interface TopicVideo {
	id: string;
	year: string;
	title: string;
	duration: string;
	description?: string | undefined;
	thumbnail?: string | undefined;
	url: string;
}

const extractTopicVideo = (card: Element): TopicVideo | undefined => {
	const href = card.getAttribute("href") ?? "";
	const [, year, id] = /\/videos\/play\/wwdc(\d{4})\/(\d+)\//u.exec(href) ?? [];
	const title = (
		card.querySelector('h4, .title, [class*="title"]')?.textContent ?? ""
	).trim();

	if (year === undefined || id === undefined || title === "") {
		return undefined;
	}

	const imgEl = card.querySelector<HTMLImageElement>("img");
	const thumbnail = firstNonEmpty(
		imgEl?.getAttribute("src"),
		imgEl?.dataset["src"],
	);
	return {
		id,
		year,
		title,
		duration: (
			card.querySelector('.video-duration, [class*="duration"], time')
				?.textContent ?? ""
		).trim(),
		description: card
			.querySelector('p, .description, [class*="description"]')
			?.textContent?.trim(),
		thumbnail: thumbnail === "" ? undefined : thumbnail,
		url: `${WWDC_URLS.BASE.replace("/videos", "")}${href}`,
	};
};

/**
 * Extract all videos on a topic's page, by its link (the `url` of a topic in the data's index.json)
 */
export const extractTopicVideos = async (
	url: string,
): Promise<TopicVideo[]> => {
	logger.info("Extracting the videos of a topic page", { url });

	try {
		const document = await fetchVideosPage(url);

		const videos = [...document.querySelectorAll('a[href*="/videos/play/"]')]
			.map((card) => extractTopicVideo(card))
			.filter((video) => video !== undefined);

		logger.info(`Found ${videos.length} videos`);
		return videos;
	} catch (error) {
		logger.error("Failed to extract the videos of a topic page", {
			url,
			error,
		});
		throw error;
	}
};
