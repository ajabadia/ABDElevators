import { ChunkingLevel, ChunkingOptions, ChunkingResult, IChunkerStrategy } from './types';
import { SimpleChunker } from './SimpleChunker';
import { SemanticChunker } from './SemanticChunker';
import { LLMChunker } from './LLMChunker';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

export interface OrchestratorInput {
    tenantId: string;
    correlationId: string;
    level?: ChunkingLevel | 'bajo' | 'medio' | 'alto'; // Support legacy/spanish inputs
    text: string;
    metadata?: {
        industry?: string;
        filename?: string;
    };
    session?: any;
    chunkSize?: number;
    chunkOverlap?: number;
    chunkThreshold?: number;
}

export class ChunkingOrchestrator {
    private static strategies: Record<ChunkingLevel, IChunkerStrategy> = {
        SIMPLE: new SimpleChunker(),
        SEMANTIC: new SemanticChunker(),
        LLM: new LLMChunker()
    };

    /**
     * Static entry point used by IngestIndexer
     */
    static async chunk(input: OrchestratorInput): Promise<ChunkingResult[]> {
        const { tenantId, correlationId, text, session } = input;

        // Normalize level
        let level: ChunkingLevel = 'SIMPLE';
        const rawLevel = input.level?.toString().toUpperCase();

        if (!rawLevel || ['BAJO', 'SIMPLE'].includes(rawLevel)) level = 'SIMPLE';
        else if (['MEDIO', 'SEMANTIC'].includes(rawLevel)) level = 'SEMANTIC';
        else if (['ALTO', 'LLM'].includes(rawLevel)) level = 'LLM';
        else {
            // Log warning for unrecognized level but proceed with default
            console.warn(`[ChunkingOrchestrator] ⚠️ Unrecognized chunking level: ${rawLevel}. Defaulting to SIMPLE.`);
            level = 'SIMPLE';
        }

        const strategy = this.strategies[level] || this.strategies.SIMPLE;
        const start = Date.now();

        try {
            const options: ChunkingOptions = {
                tenantId,
                correlationId,
                session,
                chunkSize: input.chunkSize,
                chunkOverlap: input.chunkOverlap,
                chunkThreshold: input.chunkThreshold
            };

            const results = await strategy.chunk(text, options);
            const duration = Date.now() - start;

            if (level !== 'SIMPLE') {
                await logEvento({
                    level: 'INFO',
                    source: 'CHUNKING_ORCHESTRATOR',
                    action: 'CHUNKING_COMPLETE',
                    message: `Chunking completed using ${level}`,
                    correlationId,
                    tenantId,
                    details: {
                        level,
                        chunks: results.length,
                        durationMs: duration,
                        originalLength: text.length
                    }
                });
            }

            return results;

        } catch (error: unknown) {
            const err = error as Error;
            await logEvento({
                level: 'ERROR',
                source: 'CHUNKING_ORCHESTRATOR',
                action: 'CHUNK_FAILED',
                message: `Chunking falló en nivel ${level}: ${err.message}`,
                correlationId,
                details: { error: err.stack }
            });

            // Fallback to Simple if not already Simple
            if (level !== 'SIMPLE') {
                try {
                    return await this.strategies.SIMPLE.chunk(text, { tenantId, correlationId, session });
                } catch (fallbackError: unknown) {
                    throw new AppError('INTERNAL_ERROR', 500, `Critical Chunking Failure: ${(fallbackError as Error).message}`);
                }
            }

            throw error;
        }
    }
}
