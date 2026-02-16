import { generateEmbedding } from '@/lib/llm';
import { logEvento } from '@/lib/logger';
import { ChunkResult } from './ChunkingOrchestrator';

export interface SemanticChunkerOptions {
    industry?: string;
    filename?: string;
}

/**
 * SemanticChunker: Chunking usando embeddings para detectar transiciones temáticas
 * Nivel medio - usa gemini-embedding-001
 */
export class SemanticChunker {
    private static readonly INITIAL_CHUNK_SIZE = 2000;
    private static readonly SIMILARITY_THRESHOLD = 0.85;

    static async chunk(
        text: string, 
        tenantId: string, 
        correlationId: string,
        metadata?: SemanticChunkerOptions
    ): Promise<ChunkResult[]> {
        // Step 1: Initial chunking by size
        const initialChunks = this.splitBySize(text);
        
        if (initialChunks.length <= 1) {
            return initialChunks.map(chunk => ({ text: chunk, type: 'tema' as const }));
        }

        await logEvento({
            level: 'INFO',
            source: 'SEMANTIC_CHUNKER',
            action: 'INITIAL_CHUNKS_CREATED',
            message: `Created ${initialChunks.length} initial chunks`,
            correlationId,
            tenantId,
            details: { initialChunks: initialChunks.length }
        });

        // Step 2: Generate embeddings for each chunk
        const embeddings = await Promise.all(
            initialChunks.map(async (chunk) => {
                try {
                    const emb = await generateEmbedding(chunk, tenantId, correlationId);
                    return emb;
                } catch (error) {
                    await logEvento({
                        level: 'WARN',
                        source: 'SEMANTIC_CHUNKER',
                        action: 'EMBEDDING_FAILED',
                        message: `Failed to get embedding for chunk, using fallback`,
                        correlationId,
                        tenantId,
                        details: { error: error instanceof Error ? error.message : String(error) }
                    });
                    // Return zero vector as fallback
                    return new Array(768).fill(0);
                }
            })
        );

        // Step 3: Merge chunks based on similarity
        const finalChunks = this.mergeBySimilarity(initialChunks, embeddings);

        await logEvento({
            level: 'INFO',
            source: 'SEMANTIC_CHUNKER',
            action: 'SEMANTIC_CHUNKING_COMPLETE',
            message: `Merged from ${initialChunks.length} to ${finalChunks.length} chunks`,
            correlationId,
            tenantId,
            details: { 
                initialCount: initialChunks.length, 
                finalCount: finalChunks.length 
            }
        });

        return finalChunks.map(chunk => ({ text: chunk, type: 'tema' as const }));
    }

    private static splitBySize(text: string): string[] {
        const chunks: string[] = [];
        let currentChunk = '';
        
        // Split by paragraphs first
        const paragraphs = text.split(/\n\n+/);
        
        for (const paragraph of paragraphs) {
            if (currentChunk.length + paragraph.length <= this.INITIAL_CHUNK_SIZE) {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                // If single paragraph is too large, split by sentences
                if (paragraph.length > this.INITIAL_CHUNK_SIZE) {
                    const sentences = paragraph.split(/(?<=[.!?])\s+/);
                    currentChunk = '';
                    for (const sentence of sentences) {
                        if (currentChunk.length + sentence.length <= this.INITIAL_CHUNK_SIZE) {
                            currentChunk += (currentChunk ? ' ' : '') + sentence;
                        } else {
                            if (currentChunk) {
                                chunks.push(currentChunk);
                            }
                            currentChunk = sentence;
                        }
                    }
                } else {
                    currentChunk = paragraph;
                }
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    }

    private static cosineSimilarity(a: number[], b: number[]): number {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        
        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }
        
        return dotProduct / (magnitudeA * magnitudeB);
    }

    private static mergeBySimilarity(chunks: string[], embeddings: number[][]): string[] {
        if (chunks.length <= 1) {
            return chunks;
        }

        const merged: string[] = [];
        let currentChunk = chunks[0];
        let currentEmbedding = embeddings[0];

        for (let i = 1; i < chunks.length; i++) {
            const similarity = this.cosineSimilarity(currentEmbedding, embeddings[i]);
            
            if (similarity >= this.SIMILARITY_THRESHOLD) {
                // Merge chunks
                currentChunk += '\n\n' + chunks[i];
                // Average embeddings
                currentEmbedding = currentEmbedding.map((val, j) => 
                    (val + embeddings[i][j]) / 2
                );
            } else {
                // Save current and start new
                merged.push(currentChunk);
                currentChunk = chunks[i];
                currentEmbedding = embeddings[i];
            }
        }
        
        // Push last chunk
        if (currentChunk) {
            merged.push(currentChunk);
        }

        return merged;
    }
}
