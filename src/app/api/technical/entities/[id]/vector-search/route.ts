import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { enforcePermission } from '@/lib/guardian-guard';
import { VectorSearchService } from '@abd/rag-engine/server';
import { AppError, handleApiError, NotFoundError } from '@/lib/errors';
import { ObjectId } from 'mongodb';

async function GET_internal(
    request: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('technical:analysis', 'read');
        const { id } = context.params;

        // 🛡️ SECURITY: Validate format before ObjectId constructor
        const { ObjectIdSchema } = await import('@/lib/schemas/common');
        ObjectIdSchema.parse(id);

        const collection = await getTenantCollection<any>('entities', session);
        const entity = await collection.findOne({ _id: new ObjectId(id) });

        if (!entity) throw new NotFoundError(`Entidad ${id} no encontrada`);

        let query = '';
        if (entity.detectedPatterns && entity.detectedPatterns.length > 0) {
            query = entity.detectedPatterns.map((m: any) => `${m.type} ${m.model} `).join(' ');
        } else {
            query = entity.originalText?.substring(0, 500) || '';
        }

        if (!query) return NextResponse.json({ results: [] });

        const results = await VectorSearchService.pureVectorSearch(
            query, session.user.tenantId, correlationId, { limit: 15, minScore: 0.5 }
        );

        return NextResponse.json({ success: true, results, metadata: { correlationId } });

    } catch (error: unknown) {
        return handleApiError(error, 'API_ENTITIES_VECTOR_SEARCH', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/vector-search', thresholdMs: 1000 });
