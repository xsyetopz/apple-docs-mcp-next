/**
 * The WWDC years in the bundled data, with their session counts
 */
import { logger } from "../core/logger.ts";
import { loadGlobalMetadata } from "./data-source.ts";

/**
 * List all available WWDC years
 */
export async function handleListWWDCYears(): Promise<string> {
  try {
    const metadata = await loadGlobalMetadata();

    let content = "# Available WWDC Years\n\n";

    if (!metadata.years || metadata.years.length === 0) {
      return "No WWDC years available.";
    }

    const sortedYears = [...metadata.years].sort((a, b) => b.localeCompare(a));

    content += `**Total Years:** ${sortedYears.length}\n\n`;
    content += "## Years with Video Counts\n\n";

    for (const year of sortedYears) {
      const videoCount = metadata.statistics?.byYear?.[year] || 0;
      content += `- **${year}**: ${videoCount} videos\n`;
    }

    content += `\n**Total Videos:** ${metadata.totalVideos || 0}\n`;

    if (metadata.statistics) {
      content += "\n## Statistics\n\n";
      content += `- **Videos with Code:** ${metadata.statistics.videosWithCode || 0}\n`;
      content += `- **Videos with Transcript:** ${metadata.statistics.videosWithTranscript || 0}\n`;
    }

    return content;
  } catch (error) {
    logger.error("Failed to list WWDC years:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error: Failed to list WWDC years: ${errorMessage}`;
  }
}
