import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { auth } from '@/lib/auth';
import { VectorSearchService } from '@abd/rag-engine/server';
import { withSla } from '@/lib/logger';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import { ObjectId } from 'mongodb';

/**
 * GET /api/entities/[id]/vector-search
 * High-speed semantic search for technical documents related to the entity.
 * SLA: P95 < 200ms
 * Golden Rule #3: AppError for all errors.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();

    return await withSla('API_ENTITIES_VECTOR_SEARCH', 'GET', 1000, correlationId, async () => {
        try {
            const session = await auth();
            if (!session?.user?.tenantId) {
                throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
            }

            const { id } = await params;

            // 1. Get the entity with automatic Isolation
            const collection = await getTenantCollection<any>('entities', session);
            const entity = await collection.findOne({
                _id: new ObjectId(id)
            });

            if (!entity) {
                throw new NotFoundError(`Entidad con ID ${id} no encontrada`);
            }

            // 2. Build optimized query based on detected patterns
            let query = '';
            if (entity.detectedPatterns && entity.detectedPatterns.length > 0) {
                query = entity.detectedPatterns
                    .map((m: any) => `${m.type} ${m.model} `)
                    .join(' ');
            } else {
                query = entity.originalText?.substring(0, 500) || '';
            }

            if (!query) {
                return NextResponse.json({ results: [] });
            }

            // 3. Execute pure vector search (Optimized < 200ms)
            // Note: pureVectorSearch already includes tenantId isolation internally
            // ⚡ FASE 182: Direct call to pure vector search
            const results = await VectorSearchService.pureVectorSearch(
                query,
                session.user.tenantId,
                correlationId,
                {
                    limit: 15,
                    minScore: 0.5
                }
            );

            // 4. Return results with performance headers
            return NextResponse.json({
                success: true,
                results,
                metadata: {
                    correlationId
                }
            }, {
                headers: {
                    'X-Correlation-ID': correlationId
                }
            });

        } catch (error) {
            return handleApiError(error, 'API_ENTITIES_VECTOR_SEARCH', correlationId);
        }
    });
}
