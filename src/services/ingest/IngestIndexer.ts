
import { ChunkingOrchestrator } from '@/services/infra/chunking/ChunkingOrchestrator';
import { documentChunkRepository } from '@/lib/repositories/DocumentChunkRepository';
import { IngestEmbeddingService } from './IngestEmbeddingService';
import { logEvento } from '@/lib/logger';
import { IngestTracer } from '@/services/ingest/observability/IngestTracer';
import { TenantSession } from '@/lib/db-tenant';
import { IndustryType } from '@/lib/schemas';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import { type KnowledgeAsset } from '@/lib/schemas/assets';

/**
 * IngestIndexer: Handles chunking, embedding and vector storage.
 * Refactored Phase 213: Delegating to specialized modules.
 */
export class IngestIndexer {
    static async index(
        text: string,
        visualFindings: { technical_description: string, page: number }[],
        asset: KnowledgeAsset & { _id?: any },
        context: string,
        industry: string,
        lang: string,
        correlationId: string,
        session?: TenantSession,
        onProgress?: (percent: number) => Promise<void>,
        chunkingLevel: 'SIMPLE' | 'SEMANTIC' | 'LLM' | 'bajo' | 'medio' | 'alto' = 'SIMPLE',
        chunkingConfig?: { size?: number; overlap?: number; threshold?: number },
        spacePath?: string // Phase 344
    ): Promise<number> {
        const docId = asset._id?.toString();
        if (!docId) throw new Error('asset._id is required for indexing');

        const filename = asset.source?.filename || 'unknown';
        const tId = TenantIdSchema.parse(asset.tenantId);
        const aId = EntityIdSchema.parse(docId);
        const dtId = EntityIdSchema.parse(asset.documentTypeId);
        const sId = asset.spaceId ? EntityIdSchema.parse(asset.spaceId) : undefined;
        // 0. Hierarchical Indexing (Era 11)
        if ((asset as any).enableHierarchicalRag) {
            const { HierarchicalIndexer } = await import('@/services/knowledge/HierarchicalIndexer');
            try {
                await HierarchicalIndexer.processAsset(
                    docId,
                    text,
                    asset.tenantId,
                    correlationId,
                    {
                        spaceId: asset.spaceId,
                        // spaceId and collectionId should be passed here
                    }
                );
            } catch (error) {
                await logEvento({
                    level: 'ERROR',
                    source: 'INGEST_INDEXER',
                    action: 'HIERARCHICAL_INDEX_FAILED',
                    message: `Hierarchical indexing skipped or failed: ${error}`,
                    correlationId
                });
                // We continue with standard indexing for now as fallback
            }
        }

        // 0. Cleanup existing chunks to prevent duplication (Phase 304 - Regeneration Fix)
        try {
            const deletedCount = await documentChunkRepository.deleteByAssetId(aId, session);
            if (deletedCount > 0) {
                console.log(`\x1b[45m\x1b[37m 🧬 [INGEST_INDEXER] \x1b[0m Cleaned up ${deletedCount} existing chunks for asset ${docId}`);
            }
        } catch (error) {
            console.warn(`\x1b[43m\x1b[30m ⚠️ [INGEST_INDEXER] \x1b[0m Failed to cleanup existing chunks for asset ${docId}:`, error);
        }

        // 1. Chunking
        const textChunks = await ChunkingOrchestrator.chunk({
            tenantId: asset.tenantId, correlationId, level: chunkingLevel, text,
            metadata: { industry, filename },
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
            const results = await Promise.all(batch.map(async (chunkData, batchIndex) => {
                const chunkIndex = i + batchIndex;
                const contextualizedText = `[CONTEXT: ${context}]\n\n${chunkData.text}`;

                const span = IngestTracer.startEmbeddingSpan({ correlationId, tenantId: asset.tenantId, chunkIndex });

                try {
                    // Embeddings (Era 12: Deterministic by default for SIMPLE/ADVANCED)
                    const isPremium = !!((asset as any).enableVision || (asset as any).enableTranslation || (asset as any).enableGraphRag || (asset as any).enableCognitive);
                    
                    const embedding = await IngestEmbeddingService.generateEmbeddings(
                        contextualizedText,
                        asset.tenantId,
                        correlationId,
                        { isPremium, session }
                    );

                    await documentChunkRepository.create({
                        tenantId: tId,
                        assetId: aId,
                        documentTypeId: dtId,
                        spaceId: sId,
                        index: chunkIndex,
                        sourceDoc: filename, // Mandatory Era 12
                        chunkText: chunkData.text, // Mandatory Era 12
                        chunkType: chunkData.type as 'TEXT' | 'VISUAL',
                        approxPage: chunkData.page,
                        embedding: embedding,
                        metadata: {
                            type: chunkData.type,
                            page: chunkData.page,
                            filename,
                            industry,
                            lang
                        },
                        revisionDate: new Date(),
                        language: lang || 'es',
                        spacePath,
                        createdAt: new Date()
                    } as any, session);

                    await IngestTracer.endSpanSuccess(span, { correlationId, tenantId: asset.tenantId }, { 'chunk.index': chunkIndex });
                    return true;
                } catch (error: unknown) {
                    await IngestTracer.endSpanError(span, { correlationId, tenantId: asset.tenantId }, error as Error);
                    console.error(`\x1b[41m\x1b[37m ❌ [INGEST_INDEXER] Chunk ${chunkIndex} FAILED: \x1b[0m`, error);
                    throw error; // Propagate to stop the ingestion
                }
            }));

            successCount += results.filter(r => r === true).length;

            if (onProgress) await onProgress(Math.min(95, 70 + Math.floor((i + batch.length) / allChunks.length * 25)));
        }

        if (allChunks.length > 0 && successCount === 0) {
            throw new Error(`Indexing failed: 0 chunks created out of ${allChunks.length} attempted.`);
        }

        return successCount;
    }
}
