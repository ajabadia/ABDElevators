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
        const inputLevel = input.level?.toString().toUpperCase();

        if (inputLevel === 'BAJO' || inputLevel === 'SIMPLE') level = 'SIMPLE';
        else if (inputLevel === 'MEDIO' || inputLevel === 'SEMANTIC') level = 'SEMANTIC';
        else if (inputLevel === 'ALTO' || inputLevel === 'LLM') level = 'LLM';

        const strategy = this.strategies[level] || this.strategies.SIMPLE;
        const start = Date.now();

        try {
            const options: ChunkingOptions = {
                tenantId,
                correlationId,
                session
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

        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'CHUNKING_ORCHESTRATOR',
                action: 'STRATEGY_FAILED',
                message: `Strategy ${level} failed: ${error.message}. Falling back to SIMPLE.`,
                correlationId,
                tenantId,
                stack: error.stack
            });

            // Fallback to Simple if not already Simple
            if (level !== 'SIMPLE') {
                try {
                    return await this.strategies.SIMPLE.chunk(text, { tenantId, correlationId, session });
                } catch (fallbackError: any) {
                    throw new AppError('INTERNAL_ERROR', 500, `Critical Chunking Failure: ${fallbackError.message}`);
                }
            }

            throw error;
        }
    }
}
