import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { requirePermission } from '@/lib/auth';
/**
 * GET /api/admin/cases/[id]
 * Recupera el detalle de un caso (entidad).
 */
async function getHandler(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('technical:analysis', 'read');
        const { id } = context.params;

        const collection = await getTenantCollection<any>('entities', session);
        const entity = await collection.findOne({ _id: new ObjectId(id) });

        if (!entity) throw new NotFoundError('Caso no encontrado');

        return NextResponse.json({ success: true, data: entity });
    } catch (error: unknown) {
        return handleApiError(error, 'API_GET_CASE_DETAIL', correlationId);
    }
}

export const GET = withPerformanceSLA(getHandler, {
    endpoint: 'GET_CASE_DETAIL',
    thresholdMs: 300,
    source: 'API_ADMIN'
});
