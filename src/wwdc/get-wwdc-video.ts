/**
 * One WWDC session from the bundled data, as text
 */
import { loadVideoData } from "./data-source.ts";
import { tidyCode } from "./format.ts";
import type { WWDCVideo } from "./types.ts";

export interface VideoQuery {
  year: string;
  videoId: string;
  includeTranscript: boolean;
  includeCode: boolean;
}

/**
 * Get WWDC video details
 */
export const handleGetWWDCVideo = async ({
  year,
  videoId,
  includeTranscript,
  includeCode,
}: VideoQuery): Promise<string> => {
  const video = await loadVideoData(year, videoId);

  return formatVideoDetail(video, includeTranscript, includeCode);
};

/**
 * Format video details
 */
const formatVideoDetail = (
  video: WWDCVideo,
  includeTranscript: boolean,
  includeCode: boolean,
): string => {
  let content = `# ${video.title}\n\n`;
  const facts = [`WWDC${video.year}`];
  if (video.duration) {
    facts.push(video.duration);
  }
  if (video.speakers && video.speakers.length > 0) {
    facts.push(video.speakers.join(", "));
  }
  content += `${facts.join(" · ")}\n`;
  content += `[Watch](${video.url})`;
  if (video.resources.hdVideo) {
    content += ` · [HD video](${video.resources.hdVideo})`;
  }
  content += "\n";
  if (video.topics.length > 0) {
    content += `Topics: ${video.topics.join(", ")}\n`;
  }
  for (const link of video.resources.resourceLinks ?? []) {
    content += `- [${link.title}](${link.url})\n`;
  }

  if (video.chapters && video.chapters.length > 0) {
    content += "\n## Chapters\n\n";
    video.chapters.forEach((chapter) => {
      content += `- ${chapter.timestamp} ${chapter.title}\n`;
    });
  }

  if (includeTranscript && video.transcript) {
    content += "\n## Transcript\n\n";

    if (video.transcript.segments.length > 0) {
      video.transcript.segments.forEach((segment) => {
        content += `**${segment.timestamp}** ${segment.text}\n`;
      });
    } else {
      content += `${video.transcript.fullText}\n`;
    }
  }

  if (includeCode && video.codeExamples && video.codeExamples.length > 0) {
    content += "\n## Code Examples\n\n";

    video.codeExamples.forEach((example, index) => {
      if (example.title) {
        content += `### ${example.title}`;
      } else {
        content += `### Code Example ${index + 1}`;
      }

      if (example.timestamp) {
        content += ` (${example.timestamp})`;
      }
      content += "\n";

      content += `\`\`\`${example.language}\n`;
      content += tidyCode(example.code, example.title);
      content += "\n```\n";

      if (example.context) {
        content += `*${example.context}*\n`;
      }
    });
  }

  if (video.relatedVideos && video.relatedVideos.length > 0) {
    content += "\n## Related Videos\n\n";
    video.relatedVideos.forEach((related) => {
      content += `- [${related.title}](${related.url}) (WWDC${related.year})\n`;
    });
  }

  return content;
};
