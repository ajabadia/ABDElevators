import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, AppError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { ObjectId } from 'mongodb';
import { getTenantCollection } from '@/lib/db-tenant';
import { Entity, TenantIdSchema } from '@/lib/schemas';
import { type SafeFilter } from '@/lib/repositories/BaseRepository';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * GET /api/core/entities/[type]/[id]
 * Get a single entity by type and ID.
 */
export const GET = withPerformanceSLA(async (req: NextRequest, context: { params: Promise<{ type: string, id: string }> }) => {
    return withCorrelation(
        { level: 'INFO', source: 'API_CORE_ENTITIES', action: 'GET_ENTITY' },
        async ({ log, correlationId }) => {
            const rawParams = await context.params;
            const { id } = rawParams;

            try {
                const session = await requirePermission('entities', 'read');
                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                if (!ObjectId.isValid(id)) {
                    throw new AppError('VALIDATION_ERROR', 400, 'Invalid entity ID format');
                }

                // ERA 12: Secure Collection Access
                const collection = await getTenantCollection<Entity>('orders', session, 'MAIN');
                
                const entity = await collection.findOne({ 
                    _id: new ObjectId(id) as any,
                    tenantId 
                } as SafeFilter<Entity>);

                if (!entity) {
                    throw new AppError('NOT_FOUND', 404, 'Entity not found');
                }

                await log({
                    message: `Entidad obtenida: ${id}`,
                    details: { entityType: rawParams.type, tenantId }
                });

                return NextResponse.json({
                    success: true,
                    entity,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'API_CORE_ENTITIES_GET', correlationId);
            }
        }
    );
}, { endpoint: 'GET /api/core/entities/[type]/[id]', thresholdMs: 500 });
