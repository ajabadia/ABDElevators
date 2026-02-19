export type ChunkingLevel = 'SIMPLE' | 'SEMANTIC' | 'LLM';

export interface ChunkingResult {
    text: string;
    metadata: {
        startIndex: number;
        endIndex: number;
        tokens?: number;
        title?: string;
        type?: 'section' | 'paragraph' | 'list';
    };
}

export interface ChunkingOptions {
    tenantId: string;
    correlationId: string;
    session?: any; // For billing/usage tracking
    chunkSize?: number;
    chunkOverlap?: number;
    chunkThreshold?: number; // Similarity threshold for Semantic
}

export interface IChunkerStrategy {
    level: ChunkingLevel;
    chunk(text: string, options: ChunkingOptions): Promise<ChunkingResult[]>;
}
