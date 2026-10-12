/**
 * One WWDC session from the bundled data, as text
 */
import { loadVideoData } from "./data-source.ts";
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
export async function handleGetWWDCVideo({
  year,
  videoId,
  includeTranscript,
  includeCode,
}: VideoQuery): Promise<string> {
  const video = await loadVideoData(year, videoId);

  return formatVideoDetail(video, includeTranscript, includeCode);
}

/**
 * Format video details
 */
function formatVideoDetail(
  video: WWDCVideo,
  includeTranscript: boolean,
  includeCode: boolean,
): string {
  let content = `# ${video.title}\n\n`;
  content += `**WWDC${video.year}** | [Watch Video](${video.url})\n\n`;

  if (video.duration) {
    content += `**Duration:** ${video.duration}\n`;
  }
  if (video.speakers && video.speakers.length > 0) {
    content += `**Speakers:** ${video.speakers.join(", ")}\n`;
  }
  if (video.topics.length > 0) {
    content += `**Topics:** ${video.topics.join(", ")}\n`;
  }

  if (
    video.resources.hdVideo ||
    video.resources.sdVideo ||
    video.resources.resourceLinks
  ) {
    content += "\n**Resources:**\n";
    if (video.resources.hdVideo) {
      content += `- [HD Video](${video.resources.hdVideo})\n`;
    }
    if (video.resources.sdVideo) {
      content += `- [SD Video](${video.resources.sdVideo})\n`;
    }
    if (
      video.resources.resourceLinks &&
      video.resources.resourceLinks.length > 0
    ) {
      video.resources.resourceLinks.forEach((link) => {
        content += `- [${link.title}](${link.url})\n`;
      });
    }
  }

  if (video.chapters && video.chapters.length > 0) {
    content += "\n## Chapters\n\n";
    video.chapters.forEach((chapter) => {
      content += `- **${chapter.timestamp}** ${chapter.title}\n`;
    });
  }

  if (includeTranscript && video.transcript) {
    content += "\n## Transcript\n\n";

    if (video.transcript.segments.length > 0) {
      video.transcript.segments.forEach((segment) => {
        content += `**${segment.timestamp}**\n`;
        content += `${segment.text}\n\n`;
      });
    } else {
      content += video.transcript.fullText;
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
      content += "\n\n";

      content += `\`\`\`${example.language}\n`;
      content += example.code;
      content += "\n```\n\n";

      if (example.context) {
        content += `*${example.context}*\n\n`;
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
}
