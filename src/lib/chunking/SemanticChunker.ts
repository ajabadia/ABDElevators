import { ChunkingResult, IChunkerStrategy, ChunkingOptions } from './types';
import { generateEmbedding } from '@/lib/llm';

// Utility to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}

export class SemanticChunker implements IChunkerStrategy {
    level = 'SEMANTIC' as const;
    private similarityThreshold: number;

    constructor(similarityThreshold = 0.75) {
        this.similarityThreshold = similarityThreshold;
    }

    async chunk(text: string, options: ChunkingOptions): Promise<ChunkingResult[]> {
        // 1. Split into sentences/small paragraphs first
        // Improved regex to avoid splitting acronyms (simplified)
        const rawSegments = text.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 20);

        if (rawSegments.length === 0) return [];
        if (rawSegments.length === 1) return [{
            text: rawSegments[0],
            metadata: { startIndex: 0, endIndex: rawSegments[0].length, tokens: Math.ceil(rawSegments[0].length / 4) }
        }];

        // 2. Generate embeddings for each segment
        // Batching logic could be added here to respect API limits, currently sequential/parallel-ish
        // generateEmbedding internaly uses resilience/retry
        const embeddings = await Promise.all(
            rawSegments.map(seg => generateEmbedding(seg, options.tenantId, options.correlationId, options.session))
        );

        // 3. Group by similarity
        const chunks: ChunkingResult[] = [];
        let currentChunkText = rawSegments[0];
        let currentEmbedding = embeddings[0];
        let startIndex = 0;

        for (let i = 1; i < rawSegments.length; i++) {
            const nextSegment = rawSegments[i];
            const nextEmbedding = embeddings[i];

            const similarity = cosineSimilarity(currentEmbedding, nextEmbedding);

            if (similarity >= this.similarityThreshold) {
                // Merge segments
                currentChunkText += ' ' + nextSegment;
                // Naive fusion: keep current embedding as anchor. 
                // Logic: if it's similar to the anchor, it belongs to the topic defined by the anchor.
            } else {
                // Split: push current chunk
                chunks.push({
                    text: currentChunkText,
                    metadata: {
                        startIndex,
                        endIndex: startIndex + currentChunkText.length,
                        tokens: Math.ceil(currentChunkText.length / 4)
                    }
                });

                // Reset anchor
                startIndex += currentChunkText.length + 1; // +1 for the space we added
                currentChunkText = nextSegment;
                currentEmbedding = nextEmbedding;
            }
        }

        // Push last chunk
        if (currentChunkText) {
            chunks.push({
                text: currentChunkText,
                metadata: {
                    startIndex,
                    endIndex: startIndex + currentChunkText.length,
                    tokens: Math.ceil(currentChunkText.length / 4)
                }
            });
        }

        return chunks;
    }
}
