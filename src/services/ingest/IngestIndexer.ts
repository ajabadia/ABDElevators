import { chunkText } from '@/lib/chunk-utils';
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
        onProgress?: (percent: number) => Promise<void>
    ) {
        const textChunks = await chunkText(text);
        const allChunks = [
            ...textChunks.map(tc => ({ type: 'TEXT' as const, text: tc, page: undefined })),
            ...visualFindings.map(vf => ({
                type: 'VISUAL' as const,
                text: vf.technical_description,
                page: vf.page
            }))
        ];

        const chunksCollection = await getTenantCollection('document_chunks');
        const { multilingualService } = await import('@/lib/multilingual-service');

        const BATCH_SIZE = 10;
        let successCount = 0;

        for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
            const batch = allChunks.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(batch.map(async (chunkData) => {
                const contextualizedText = `[CONTEXT: ${context}]\n\n${chunkData.text}`;

                const [embeddingGemini, embeddingBGE] = await Promise.all([
                    generateEmbedding(contextualizedText, asset.tenantId, correlationId),
                    multilingualService.generateEmbedding(contextualizedText)
                ]);

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
