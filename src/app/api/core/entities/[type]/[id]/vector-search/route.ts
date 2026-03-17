import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { requirePermission } from '@/lib/auth';
import { VectorSearchService } from '@abd/rag-engine/server';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import { ObjectId } from 'mongodb';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { Entity, TenantIdSchema } from '@/lib/schemas';
import { type SafeFilter } from '@/lib/repositories/BaseRepository';

export const GET = withPerformanceSLA(async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) =>
    withCorrelation(
        { level: 'INFO', source: 'APIENTITIESVECTORSEARCH', action: 'VECTORSEARCH' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:analysis', 'read');
                const { id } = await context.params;
                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                // 🛡️ SECURITY: Validate format before ObjectId constructor
                const { ObjectIdSchema } = await import('@/lib/schemas/common');
                ObjectIdSchema.parse(id);

                const collection = await getTenantCollection<Entity>('orders', session, 'MAIN');
                const entity = await collection.findOne({ 
                    _id: new ObjectId(id) as any,
                    tenantId 
                } as SafeFilter<Entity>);

                if (!entity) throw new NotFoundError(`Entidad ${id} no encontrada`);

                let query = '';
                if (entity.detectedPatterns && entity.detectedPatterns.length > 0) {
                    query = entity.detectedPatterns.map((m: { type: string, model: string }) => `${m.type} ${m.model} `).join(' ');
                } else {
                    query = entity.originalText?.substring(0, 500) || '';
                }

                if (!query) return NextResponse.json({ results: [], correlationId });

                const results = await VectorSearchService.pureVectorSearch(
                    query, session.user.tenantId, correlationId, { limit: 15, minScore: 0.5 }
                );

                await log({
                    message: 'Vector search performed for entity',
                    details: {
                        tenantId: session.user.tenantId,
                        userId: session.user.id,
                        entityId: id,
                        queryLen: query.length,
                        results: results.length
                    }
                });

                return NextResponse.json({ success: true, results, correlationId });

            } catch (error: unknown) {
                return handleApiError(error, 'APIENTITIESVECTORSEARCH', correlationId);
            }
        }
    ),
    { endpoint: 'GET /api/technical/entities/[id]/vector-search', thresholdMs: 1000 }
);
