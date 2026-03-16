import { ChunkingLevel, ChunkingOptions, ChunkingResult, IChunkerStrategy } from './types';
import { SimpleChunker } from './SimpleChunker';
import { SemanticChunker } from './SemanticChunker';
import { LLMChunker } from './LLMChunker';
import { AppError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { VerticalRegistryService } from '@/services/core/vertical-registry';
import { IndustryType } from '@/lib/schemas';

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
        const { tenantId, correlationId, text, session, metadata } = input;
        const industry = (metadata?.industry as IndustryType) || 'GENERIC';

        return await withCorrelation(
            { level: 'INFO', source: 'CHUNKING_ORCHESTRATOR', action: 'CHUNKING_PROCESS', correlationId, tenantId },
            async ({ log }) => {
                // Normalize level
                let level: ChunkingLevel = 'SIMPLE';
                const rawLevel = input.level?.toString().toUpperCase();

                if (!rawLevel || ['BAJO', 'SIMPLE'].includes(rawLevel)) level = 'SIMPLE';
                else if (['MEDIO', 'SEMANTIC'].includes(rawLevel)) level = 'SEMANTIC';
                else if (['ALTO', 'LLM'].includes(rawLevel)) level = 'LLM';
                else level = 'SIMPLE';

                const config = VerticalRegistryService.getConfig(industry);
                const presets = config.ragPresets;

                const options: ChunkingOptions = {
                    tenantId,
                    correlationId,
                    session,
                    chunkSize: input.chunkSize || presets.chunkSize,
                    chunkOverlap: input.chunkOverlap || presets.chunkOverlap,
                    chunkThreshold: input.chunkThreshold
                };

                const strategy = this.strategies[level] || this.strategies.SIMPLE;
                const start = Date.now();

                try {
                    const results = await strategy.chunk(text, options);
                    const duration = Date.now() - start;

                    await log({
                        message: `Chunking completed using ${level} for industry ${industry}`,
                        details: {
                            level,
                            industry,
                            chunks: results.length,
                            durationMs: duration,
                            chunkSize: options.chunkSize,
                            chunkOverlap: options.chunkOverlap
                        }
                    });

                    return results;
                } catch (error: unknown) {
                    const err = error as Error;
                    await log({
                        level: 'ERROR',
                        action: 'CHUNK_FAILED',
                        message: `Chunking falló en nivel ${level}: ${err.message}`,
                        details: { error: err.stack, level, industry }
                    });

                    // Fallback to Simple if not already Simple
                    if (level !== 'SIMPLE') {
                        try {
                            return await this.strategies.SIMPLE.chunk(text, options);
                        } catch (fallbackError: unknown) {
                            throw new AppError('INTERNAL_ERROR', 500, `Critical Chunking Failure: ${(fallbackError as Error).message}`);
                        }
                    }

                    throw error;
                }
            }
        );
    }
}
