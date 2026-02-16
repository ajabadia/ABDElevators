import { ChunkingOrchestrator } from '@/lib/chunking/ChunkingOrchestrator';
import { generateEmbedding } from '@/lib/llm';
import { getTenantCollection } from '@/lib/db-tenant';
import { DocumentChunkSchema } from '@/lib/schemas';
import { ObjectId } from 'mongodb';

/**
 * IngestIndexer: Handles chunking, embedding and vector storage (Phase 105 Hygiene).
 */
export class IngestIndexer {
    static async index(
        text: string,
        visualFindings: any[],
        asset: any,
        context: string,
        industry: string,
        lang: string,
        correlationId: string,
        session?: any,
        onProgress?: (percent: number) => Promise<void>,
        chunkingLevel: 'SIMPLE' | 'SEMANTIC' | 'LLM' | 'bajo' | 'medio' | 'alto' = 'SIMPLE' // Phase 134
    ) {
        // Phase 2: Import observability utilities
        const { IngestTracer } = await import('@/services/ingest/observability/IngestTracer');
        const { withLLMRetry } = await import('@/lib/llm-retry');
        const { LLMCostTracker } = await import('@/services/ingest/observability/LLMCostTracker');

        const textChunks = await ChunkingOrchestrator.chunk({
            tenantId: asset.tenantId,
            correlationId,
            level: chunkingLevel,
            text,
            metadata: {
                industry,
                filename: asset.filename
            }
        });

        const allChunks = [
            ...textChunks.map(tc => ({ type: 'TEXT' as const, text: tc.text, page: undefined })),
            ...visualFindings.map(vf => ({
                type: 'VISUAL' as const,
                text: vf.technical_description,
                page: vf.page
            }))
        ];

        const chunksCollection = await getTenantCollection('document_chunks', session);
        const { multilingualService } = await import('@/lib/multilingual-service');

        const BATCH_SIZE = 10;
        let successCount = 0;

        for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
            const batch = allChunks.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(batch.map(async (chunkData, batchIndex) => {
                const chunkIndex = i + batchIndex;
                const contextualizedText = `[CONTEXT: ${context}]\n\n${chunkData.text}`;

                // Phase 2: Wrap embedding generation with retry + tracing
                const embeddingSpan = IngestTracer.startEmbeddingSpan({
                    correlationId,
                    tenantId: asset.tenantId,
                    chunkIndex,
                });

                try {
                    const embeddingStart = Date.now();

                    // Gemini embedding with retry
                    const embeddingGemini = await withLLMRetry(
                        () => generateEmbedding(contextualizedText, asset.tenantId, correlationId, session),
                        {
                            operation: 'EMBEDDING_GEMINI',
                            tenantId: asset.tenantId,
                            correlationId,
                        },
                        { maxRetries: 2, timeoutMs: 5000 }
                    );

                    // BGE embedding (no retry needed - local model)
                    const embeddingBGE = await multilingualService.generateEmbedding(contextualizedText);

                    const embeddingDuration = Date.now() - embeddingStart;

                    // Track cost (Gemini embedding only, BGE is local)
                    const embeddingTokens = Math.ceil(contextualizedText.length / 4);
                    await LLMCostTracker.trackOperation(
                        correlationId,
                        'EMBEDDING',
                        'text-embedding-004',
                        embeddingTokens,
                        0, // Embeddings don't have output tokens
                        embeddingDuration
                    );

                    // End span success
                    await IngestTracer.endSpanSuccess(embeddingSpan, {
                        correlationId,
                        tenantId: asset.tenantId,
                    }, {
                        'llm.tokens.input': embeddingTokens,
                        'chunk.index': chunkIndex,
                        'chunk.type': chunkData.type,
                    });

                    const chunk = DocumentChunkSchema.parse({
                        tenantId: asset.tenantId,
                        industry,
                        componentType: asset.componentType,
                        sourceDoc: asset.filename,
                        version: asset.version,
                        language: chunkData.type === 'VISUAL' ? 'es' : lang,
                        chunkType: chunkData.type,
                        chunkText: chunkData.text,
                        approxPage: chunkData.page,
                        embedding: embeddingGemini,
                        embedding_multilingual: embeddingBGE,
                        cloudinaryUrl: asset.cloudinaryUrl,
                        environment: asset.environment,
                        createdAt: new Date(),
                    });

                    await chunksCollection.insertOne(chunk);
                    return true;
                } catch (error: any) {
                    await IngestTracer.endSpanError(embeddingSpan, {
                        correlationId,
                        tenantId: asset.tenantId,
                    }, error);
                    throw error; // Re-throw to be caught by Promise.allSettled
                }
            }));

            successCount += results.filter(r => r.status === 'fulfilled').length;
            if (onProgress) {
                const percent = Math.min(95, 70 + Math.floor((i + batch.length) / allChunks.length * 25));
                await onProgress(percent);
            }
        }

        return successCount;
    }
}
