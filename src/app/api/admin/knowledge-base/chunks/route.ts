import { NextResponse } from 'next/server';
import { auth, requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { handleApiError, ValidationError } from '@/lib/errors';
import { z } from 'zod';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { type DocumentChunk } from '@/lib/schemas';
import { type Filter } from 'mongodb';

const ListChunksSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    q: z.string().optional(),
    assetId: z.string().optional(),
    spacePath: z.string().optional(),
    mode: z.enum(['regex', 'semantic']).default('regex'),
});

/**
 * GET /api/admin/knowledge-base/chunks
 * Proposito: Explorador de chunks con soporte para búsqueda híbrida y paginación por cursor.
 * REGLA #8: P95 < 500ms
 */
export const GET = withPerformanceSLA(async (req: Request) => {
    const correlationId = crypto.randomUUID();

    try {
        const session = await requirePermission('knowledge', 'read');

        const { searchParams } = new URL(req.url);
        const validated = ListChunksSchema.parse(Object.fromEntries(searchParams));

        const collection = await getTenantCollection<DocumentChunk>('document_chunks', session as any);

        // Build filter
        const filter: Filter<DocumentChunk> = {};

        if (validated.assetId) filter.assetId = validated.assetId as any;
        if (validated.cursor) {
            filter._id = { $lt: validated.cursor } as any; // Cursor temporal simplificado
        }

        if (validated.spacePath) {
            // Hierarchical prefix search using denormalized spacePath
            filter.spacePath = { $regex: `^${validated.spacePath}` } as any;
        }

        if (validated.q) {
            if (validated.mode === 'regex') {
                filter.text = { $regex: validated.q, $options: 'i' } as any;
            } else {
                // Semantic search logic (TBD if needed here, usually handled by a specialized service)
                filter.text = { $regex: validated.q, $options: 'i' } as any;
            }
        }

        // Hardcoded limit for safety
        const limit = Math.min(validated.limit, 100);

        const chunks = await collection.find(filter, {
            sort: { _id: -1 }, // ID descending for cursor
            limit: limit + 1
        });

        const hasMore = chunks.length > limit;
        const results = hasMore ? chunks.slice(0, limit) : chunks;
        const nextCursor = hasMore ? results[results.length - 1]._id.toString() : null;

        return NextResponse.json({
            success: true,
            chunks: results,
            pagination: {
                limit,
                nextCursor,
                hasMore
            }
        });

    } catch (error) {
        return handleApiError(error, 'API_KB_CHUNKS', correlationId);
    }
}, { endpoint: 'API_KB_CHUNKS', thresholdMs: 500 });
