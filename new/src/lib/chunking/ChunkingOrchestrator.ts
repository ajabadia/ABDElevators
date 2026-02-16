import { logEvento } from '@/lib/logger';
import { SimpleChunker } from './SimpleChunker';
import { SemanticChunker } from './SemanticChunker';
import { LLMChunker } from './LLMChunker';

export type ChunkingLevel = 'bajo' | 'medio' | 'alto';

export interface ChunkResult {
    text: string;
    title?: string;
    type?: 'tema' | 'subtema';
}

export interface ChunkingOptions {
    tenantId: string;
    correlationId: string;
    level?: ChunkingLevel;
    text: string;
    metadata?: {
        industry?: string;
        filename?: string;
    };
}

/**
 * ChunkingOrchestrator: Factory que selecciona la estrategia de chunking según el nivel.
 * Phase 134: Sistema de Chunking por Niveles
 */
export class ChunkingOrchestrator {
    private static readonly DEFAULT_LEVEL: ChunkingLevel = 'bajo';

    static async chunk(options: ChunkingOptions): Promise<ChunkResult[]> {
        const { tenantId, correlationId, level = this.DEFAULT_LEVEL, text, metadata } = options;

        await logEvento({
            level: 'INFO',
            source: 'CHUNKING_ORCHESTRATOR',
            action: 'CHUNKING_START',
            message: `Starting chunking with level: ${level}`,
            correlationId,
            tenantId,
            details: { level, textLength: text.length }
        });

        const startTime = Date.now();
        let chunks: ChunkResult[];

        try {
            switch (level) {
                case 'bajo':
                    chunks = await SimpleChunker.chunk(text, metadata);
                    break;
                case 'medio':
                    chunks = await SemanticChunker.chunk(text, tenantId, correlationId, metadata);
                    break;
                case 'alto':
                    chunks = await LLMChunker.chunk(text, tenantId, correlationId, metadata);
                    break;
                default:
                    await logEvento({
                        level: 'WARN',
                        source: 'CHUNKING_ORCHESTRATOR',
                        action: 'INVALID_LEVEL',
                        message: `Invalid chunking level: ${level}, falling back to 'bajo'`,
                        correlationId,
                        tenantId
                    });
                    chunks = await SimpleChunker.chunk(text, metadata);
            }

            const duration = Date.now() - startTime;

            await logEvento({
                level: 'INFO',
                source: 'CHUNKING_ORCHESTRATOR',
                action: 'CHUNKING_SUCCESS',
                message: `Chunking complete. Generated ${chunks.length} chunks in ${duration}ms`,
                correlationId,
                tenantId,
                details: { level, chunksCount: chunks.length, duration_ms: duration }
            });

            return chunks;
        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'CHUNKING_ORCHESTRATOR',
                action: 'CHUNKING_FAILED',
                message: `Chunking failed with level: ${level}`,
                correlationId,
                tenantId,
                stack: error instanceof Error ? error.stack : undefined,
                details: { level, error: error instanceof Error ? error.message : String(error) }
            });

            // Fallback to simple chunker on error
            if (level !== 'bajo') {
                await logEvento({
                    level: 'WARN',
                    source: 'CHUNKING_ORCHESTRATOR',
                    action: 'FALLBACK_TO_SIMPLE',
                    message: 'Falling back to SimpleChunker due to error',
                    correlationId,
                    tenantId
                });
                return SimpleChunker.chunk(text, metadata);
            }

            throw error;
        }
    }
}
