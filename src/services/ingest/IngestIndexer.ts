
import { ChunkingOrchestrator } from '@/services/infra/chunking/ChunkingOrchestrator';
import { documentChunkRepository } from '@/lib/repositories/DocumentChunkRepository';
import { IngestEmbeddingService } from './IngestEmbeddingService';
import { logEvento } from '@/lib/logger';
import { IngestTracer } from '@/services/ingest/observability/IngestTracer';
import { TenantSession } from '@/lib/db-tenant';
import { IndustryType } from '@/lib/schemas';

/**
 * IngestIndexer: Handles chunking, embedding and vector storage.
 * Refactored Phase 213: Delegating to specialized modules.
 */
export class IngestIndexer {
    static async index(
        text: string,
        visualFindings: { technical_description: string, page: number }[],
        asset: {
            tenantId: string,
            filename: string,
            enableVision?: boolean,
            enableTranslation?: boolean,
            enableGraphRag?: boolean,
            enableCognitive?: boolean,
            usage?: string,
            componentType?: string,
            model?: string,
            version?: string,
            revisionDate?: Date,
            cloudinaryUrl?: string | null,
            environment?: string
        },
        context: string,
        industry: string,
        lang: string,
        correlationId: string,
        session?: TenantSession,
        onProgress?: (percent: number) => Promise<void>,
        chunkingLevel: 'SIMPLE' | 'SEMANTIC' | 'LLM' | 'bajo' | 'medio' | 'alto' = 'SIMPLE',
        chunkingConfig?: { size?: number; overlap?: number; threshold?: number }
    ): Promise<number> {
        // 1. Chunking
        const textChunks = await ChunkingOrchestrator.chunk({
            tenantId: asset.tenantId, correlationId, level: chunkingLevel, text,
            metadata: { industry, filename: asset.filename },
            chunkSize: chunkingConfig?.size, chunkOverlap: chunkingConfig?.overlap, chunkThreshold: chunkingConfig?.threshold,
        });

        const allChunks = [
            ...textChunks.map(tc => ({ type: 'TEXT' as const, text: tc.text, page: undefined })),
            ...visualFindings.map(vf => ({ type: 'VISUAL' as const, text: vf.technical_description, page: vf.page }))
        ];

        const BATCH_SIZE = 5;
        let successCount = 0;

        for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
            const batch = allChunks.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(batch.map(async (chunkData, batchIndex) => {
                const chunkIndex = i + batchIndex;
                const contextualizedText = `[CONTEXT: ${context}]\n\n${chunkData.text}`;

                const span = IngestTracer.startEmbeddingSpan({ correlationId, tenantId: asset.tenantId, chunkIndex });

                try {
                    // Embeddings
                    const isPremium = asset.enableVision || asset.enableTranslation || asset.enableGraphRag || asset.enableCognitive;
                    const shouldSkipGemini = asset.usage === 'REFERENCE' && !isPremium;

                    const [embGemini, embBGE] = await Promise.all([
                        shouldSkipGemini ? Promise.resolve(undefined) : IngestEmbeddingService.generateGeminiEmbedding(contextualizedText, asset.tenantId, correlationId, session),
                        IngestEmbeddingService.generateBGEEmbedding(contextualizedText)
                    ]);

                    await documentChunkRepository.create({
                        tenantId: asset.tenantId,
                        industry: industry as IndustryType,
                        componentType: asset.componentType || 'DOCUMENT',
                        model: asset.model || 'UNKNOWN',
                        sourceDoc: asset.filename,
                        version: asset.version || '1.0',
                        revisionDate: asset.revisionDate || new Date(),
                        language: lang || 'es',
                        chunkType: chunkData.type,
                        chunkText: chunkData.text,
                        approxPage: chunkData.page,
                        embedding: embGemini,
                        embedding_multilingual: embBGE,
                        cloudinaryUrl: asset.cloudinaryUrl ?? undefined,
                        environment: (asset.environment as any) || 'PRODUCTION',
                        createdAt: new Date(),
                    }, session as TenantSession | undefined);

                    await IngestTracer.endSpanSuccess(span, { correlationId, tenantId: asset.tenantId }, { 'chunk.index': chunkIndex });
                    return true;
                } catch (error: unknown) {
                    await IngestTracer.endSpanError(span, { correlationId, tenantId: asset.tenantId }, error as Error);
                    throw error;
                }
            }));

            successCount += results.filter(r => r.status === 'fulfilled').length;
            if (onProgress) await onProgress(Math.min(95, 70 + Math.floor((i + batch.length) / allChunks.length * 25)));
        }

        return successCount;
    }
}
