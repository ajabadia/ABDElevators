import { ChunkingResult, IChunkerStrategy, ChunkingOptions } from './types';

export class SimpleChunker implements IChunkerStrategy {
    level = 'SIMPLE' as const;
    private chunkSize: number;
    private overlap: number;

    constructor(chunkSize = 1500, overlap = 200) {
        this.chunkSize = chunkSize;
        this.overlap = overlap;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async chunk(text: string, options: ChunkingOptions): Promise<ChunkingResult[]> {
        // Phase 134.2: Dynamic Config
        const finalChunkSize = options.chunkSize || this.chunkSize;
        const finalOverlap = options.chunkOverlap !== undefined ? options.chunkOverlap : this.overlap;

        const chunks: ChunkingResult[] = [];
        let startIndex = 0;

        // Simple robust looping
        while (startIndex < text.length) {
            let endIndex = startIndex + finalChunkSize;

            // Prevent out of bounds
            if (endIndex > text.length) {
                endIndex = text.length;
            }

            let chunkText = text.slice(startIndex, endIndex);

            // Adjust to nearest sentence or newline to avoid cutting words
            // Only if we are not at the end of the text
            if (endIndex < text.length) {
                const lastPeriod = chunkText.lastIndexOf('.');
                const lastNewline = chunkText.lastIndexOf('\n');
                const breakPoint = Math.max(lastPeriod, lastNewline);

                // Only cut if reasonably far (avoid creating tiny chunks if no punctuation found)
                if (breakPoint > finalChunkSize * 0.5) {
                    // Recalculate end index based on breakpoint
                    endIndex = startIndex + breakPoint + 1; // Include the punctuation
                    chunkText = text.slice(startIndex, endIndex);
                }
            }

            chunks.push({
                text: chunkText.trim(),
                metadata: {
                    startIndex,
                    endIndex,
                    tokens: Math.ceil(chunkText.length / 4)
                }
            });

            // Move window
            startIndex += (chunkText.length - finalOverlap);

            // Safety break for infinite loops if overlap >= chunk size (bad config)
            if (chunkText.length <= finalOverlap && startIndex < text.length) {
                startIndex = endIndex; // Force advance if stuck
            }
        }

        return chunks;
    }
}
