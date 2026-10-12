/**
 * The WWDC topics in the bundled data, or one topic's sessions
 */
import { loadGlobalMetadata, loadTopicIndex } from "./data-source.ts";

export interface TopicsQuery {
  topicId?: string | undefined;
  includeVideos: boolean;
  year?: string | undefined;
  limit: number;
}

/**
 * Browse WWDC topics
 */
export const handleBrowseWWDCTopics = async ({
  topicId,
  includeVideos,
  year,
  limit,
}: TopicsQuery): Promise<string> => {
  const metadata = await loadGlobalMetadata();

  if (!topicId) {
    let content = "# WWDC Topics\n\n";
    content += `Found ${metadata.topics.length} topics:\n\n`;

    metadata.topics.forEach((topic) => {
      content += `## [${topic.name}](${topic.url})\n`;
      content += `**Topic ID:** ${topic.id}\n`;

      const topicStats = metadata.statistics.byTopic[topic.id];
      if (topicStats) {
        content += `**Videos:** ${topicStats}\n`;
      }

      content += "\n";
    });

    return content;
  }

  const topic = metadata.topics.find((t) => t.id === topicId);
  if (!topic) {
    return `Topic "${topicId}" not found. Available topics: ${metadata.topics.map((t) => t.id).join(", ")}`;
  }

  let content = `# ${topic.name}\n\n`;
  content += `**Topic ID:** ${topic.id}\n`;
  content += `**URL:** [${topic.url}](${topic.url})\n\n`;

  if (includeVideos) {
    try {
      const topicIndex = await loadTopicIndex(topicId);

      let videosToShow = topicIndex.videos;
      if (year && year !== "all") {
        videosToShow = videosToShow.filter((v) => v.year === year);
      }

      videosToShow = videosToShow.slice(0, limit);

      content += `## Videos (${videosToShow.length}${videosToShow.length === limit ? "+" : ""})\n\n`;

      if (videosToShow.length === 0) {
        content += "No videos found for this topic.\n";
      } else {
        const videosByYear = videosToShow.reduce(
          (acc, video) => {
            const group = acc[video.year] ?? [];
            group.push(video);
            acc[video.year] = group;
            return acc;
          },
          {} as Record<string, typeof videosToShow>,
        );

        Object.keys(videosByYear)
          .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
          .forEach((y) => {
            content += `### WWDC${y}\n\n`;

            (videosByYear[y] ?? []).forEach((video) => {
              content += `- [${video.title}](${video.url})`;

              const features: string[] = [];
              if (video.hasTranscript) {
                features.push("Transcript");
              }
              if (video.hasCode) {
                features.push("Code");
              }

              if (features.length > 0) {
                content += ` | ${features.join(" | ")}`;
              }

              content += "\n";
            });

            content += "\n";
          });
      }
    } catch (error) {
      content += `Error loading videos for topic: ${error instanceof Error ? error.message : String(error)}\n`;
    }
  }

  return content;
};
