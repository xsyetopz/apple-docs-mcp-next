/**
 * Sessions related to one WWDC session, from the bundled data
 */
import { logger } from "../core/logger.ts";
import {
  loadGlobalMetadata,
  loadTopicIndex,
  loadVideoData,
  loadYearIndex,
} from "./data-source.ts";
import { sessionLine } from "./format.ts";
import { loadVideosData } from "./load-videos.ts";
import type { WWDCVideo } from "./types.ts";

export interface RelatedVideosQuery {
  videoId: string;
  year: string;
  includeExplicitRelated: boolean;
  includeTopicRelated: boolean;
  includeYearRelated: boolean;
  limit: number;
}

/**
 * Find related WWDC videos
 */
export const handleFindRelatedWWDCVideos = async ({
  videoId,
  year,
  includeExplicitRelated,
  includeTopicRelated,
  includeYearRelated,
  limit,
}: RelatedVideosQuery): Promise<string> => {
  const sourceVideo = await loadVideoData(year, videoId);

  let content = `# Related to [${sourceVideo.title}](${sourceVideo.url}) (WWDC${year})\n\n`;

  const relatedVideos: Array<{
    video: WWDCVideo & { year: string };
    relationship: string;
    score: number;
  }> = [];

  if (includeExplicitRelated && sourceVideo.relatedVideos) {
    for (const related of sourceVideo.relatedVideos) {
      try {
        const relatedVideo = await loadVideoData(related.year, related.id);

        relatedVideos.push({
          video: { ...relatedVideo, year: related.year },
          relationship: "Explicitly related",
          score: 10,
        });
      } catch (error) {
        logger.warn(
          `Failed to load related video ${related.year}-${related.id}:`,
          error,
        );
      }
    }
  }

  if (
    includeTopicRelated &&
    sourceVideo.topics &&
    sourceVideo.topics.length > 0
  ) {
    for (const topic of sourceVideo.topics) {
      try {
        const metadata = await loadGlobalMetadata();
        const topicEntry = metadata.topics.find(
          (t) =>
            t.name.toLowerCase() === topic.toLowerCase() ||
            t.id
              .toLowerCase()
              .includes(topic.toLowerCase().replace(/\s+/g, "-")),
        );

        if (topicEntry) {
          const topicIndex = await loadTopicIndex(topicEntry.id);

          const topicVideos = topicIndex.videos.filter((v) => v.id !== videoId);

          const videoFiles = topicVideos.slice(0, 10).map((v) => v.dataFile); // Limit to avoid too many requests
          const videos = await loadVideosData(videoFiles);

          for (const video of videos) {
            if (
              relatedVideos.find(
                (r) => r.video.id === video.id && r.video.year === video.year,
              )
            ) {
              continue;
            }

            const sharedTopics = (sourceVideo.topics || []).filter(
              (t) =>
                video.topics?.some(
                  (vt) => vt.toLowerCase() === t.toLowerCase(),
                ) || false,
            );
            const score = sharedTopics.length * 2;

            relatedVideos.push({
              video: { ...video, year: video.year },
              relationship: `Same topic: ${topicEntry.name}`,
              score,
            });
          }
        }
      } catch (error) {
        logger.warn(
          `Failed to find topic-related videos for topic ${topic}:`,
          error,
        );
      }
    }
  }

  if (includeYearRelated) {
    try {
      const yearIndex = await loadYearIndex(year);

      const yearVideos = yearIndex.videos.filter(
        (v) =>
          v.id !== videoId &&
          v.topics.some(
            (t) =>
              sourceVideo.topics?.some(
                (st) => st.toLowerCase() === t.toLowerCase(),
              ) || false,
          ),
      );

      const videoFiles = yearVideos.slice(0, 10).map((v) => v.dataFile);
      const videos = await loadVideosData(videoFiles);

      for (const video of videos) {
        if (
          relatedVideos.find(
            (r) => r.video.id === video.id && r.video.year === video.year,
          )
        ) {
          continue;
        }

        const sharedTopics = (sourceVideo.topics || []).filter(
          (t) =>
            video.topics?.some((vt) => vt.toLowerCase() === t.toLowerCase()) ||
            false,
        );
        const score = sharedTopics.length;

        relatedVideos.push({
          video: { ...video, year: video.year },
          relationship: `Same year, shared topics: ${sharedTopics.join(", ")}`,
          score,
        });
      }
    } catch (error) {
      logger.warn("Failed to find year-related videos:", error);
    }
  }

  relatedVideos.sort((a, b) => b.score - a.score);
  const limitedResults = relatedVideos.slice(0, limit);

  if (limitedResults.length === 0) {
    content += "No related videos found.\n";
  } else {
    content += `${limitedResults.length} of ${relatedVideos.length} sessions\n\n`;
    content += `${limitedResults
      .map((result) =>
        sessionLine(result.video, {
          showYear: true,
          showTopics: false,
          note: result.relationship,
        }),
      )
      .join("\n")}\n`;
    if (relatedVideos.length > limitedResults.length) {
      content += `\nShowing ${limitedResults.length} of ${relatedVideos.length}. Raise limit for more.\n`;
    }
  }

  return content;
};
