import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { type DocumentChunk } from '@/lib/schemas';
import { type Filter, ObjectId } from 'mongodb';
import { withCorrelation } from '@/lib/logger/with-correlation';

const ListChunksSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    q: z.string().optional(),
    assetId: z.string().optional(),
    spacePath: z.string().optional(),
    mode: z.enum(['regex', 'semantic']).default('regex'),
});

const API_SOURCE = 'API_KB_CHUNKS';

/**
 * GET /api/admin/knowledge-base/chunks
 * Proposito: Explorador de chunks con soporte para búsqueda híbrida y paginación por cursor.
 * REGLA #8: P95 < 500ms
 */
export const GET = withPerformanceSLA(async (req: Request) => {
    return withCorrelation(
        { level: 'INFO', source: API_SOURCE, action: 'FETCH_CHUNKS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('knowledge', 'read');
                const { searchParams } = new URL(req.url);
                const searchEntries = Object.fromEntries(searchParams);
                
                const validated = ListChunksSchema.parse(searchEntries);
                const collection = await getTenantCollection<DocumentChunk>('document_chunks', session as any);

                // Build filter
                const filter: Filter<DocumentChunk> = {};

                if (validated.assetId) {
                    try {
                        const oid = new ObjectId(validated.assetId);
                        filter.assetId = { $in: [oid, validated.assetId] } as any;
                    } catch (e) {
                        filter.assetId = validated.assetId as any;
                    }
                }
                if (validated.cursor) {
                    filter._id = { $lt: validated.cursor } as any;
                }

                if (validated.spacePath) {
                    filter.spacePath = { $regex: `^${validated.spacePath}` } as any;
                }

                if (validated.q) {
                    filter.chunkText = { $regex: validated.q, $options: 'i' } as any;
                }

                // Hardcoded limit for safety
                const limit = Math.min(validated.limit, 100);

                // Parallel data fetching
                const [total, languages, aiConfig, rawResult] = await Promise.all([
                    collection.countDocuments(filter),
                    collection.distinct('language', {}),
                    import('@/services/core/ai-model-manager').then(m => m.AiModelManager.getTenantAiConfig(session as any)),
                    collection.find(filter, {
                        sort: { _id: -1 },
                        limit: limit + 1
                    })
                ]);

                let chunks: DocumentChunk[];
                if (Array.isArray(rawResult)) {
                    chunks = rawResult as DocumentChunk[];
                } else if (rawResult && typeof (rawResult as any).toArray === 'function') {
                    chunks = await (rawResult as any).toArray() as DocumentChunk[];
                } else {
                    throw new Error(`[API_KB_CHUNKS] Unsupported result from find()`);
                }

                const hasMore = chunks.length > limit;
                const results = hasMore ? chunks.slice(0, limit) : chunks;
                const lastChunk = results[results.length - 1];
                const nextCursor = (hasMore && lastChunk?._id) ? lastChunk._id.toString() : null;

                await log({
                    message: `Successfully retrieved ${chunks.length} chunks`,
                    details: { count: chunks.length, total, assetId: validated.assetId }
                });

                return NextResponse.json({
                    success: true,
                    chunks: results,
                    total,
                    metadata: {
                        embeddingModel: aiConfig?.embeddingModel || 'text-embedding-004',
                        languages: languages || []
                    },
                    pagination: {
                        limit,
                        nextCursor,
                        hasMore
                    },
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, API_SOURCE, correlationId);
            }
        }
    );
}, { endpoint: 'API_KB_CHUNKS', thresholdMs: 500 });
