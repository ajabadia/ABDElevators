import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError } from '@/lib/errors';
import { TenantIdSchema, EntityIdSchema } from '@/lib/schemas';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function GET_internal(
    req: NextRequest,
    context: { params: Promise<{ id: string, type: string }> } // Standard Promise-based params
) {
    return withCorrelation(
        { level: 'INFO', source: 'API_ENTITIES_ANALYZE', action: 'ENQUEUE' },
        async ({ correlationId, log }) => {
            try {
                const session = await requirePermission('technical:analysis', 'execute');
                const { id } = await context.params;

                // 🛡️ SECURITY: Validate format
                const { ObjectIdSchema } = await import('@/lib/schemas/common');
                ObjectIdSchema.parse(id);

                const tenantId = TenantIdSchema.parse(session.user.tenantId);

                await log({
                    message: `Initiating analysis for entity ${id}`,
                    details: { entityId: id },
                    tenantId
                });

                // 1. Fetch entity
                const collection = await getTenantCollection<any>('entities', session);
                const entity = await collection.findOne({ _id: new ObjectId(id) });

                if (!entity) {
                    throw new AppError('NOT_FOUND', 404, 'Entidad no encontrada');
                }

                // 2. Enqueue the analysis job
                const { addAnalysisJob } = await import('@/lib/queues/analysis-queue');

                const job = await addAnalysisJob({
                    entityId: EntityIdSchema.parse(id),
                    entityText: entity.originalText || '',
                    filename: entity.identifier || 'unknown',
                    tenantId,
                    industry: entity.industry || 'ELEVATORS',
                    correlationId,
                    fileMd5: entity.md5Hash || ''
                });

                // 3. Update entity status
                await collection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            status: 'processing',
                            jobId: job.id,
                            lastAnalysisStart: new Date()
                        }
                    }
                );

                await log({
                    message: 'Analysis job successfully enqueued',
                    details: { jobId: job.id, entityId: id },
                    tenantId
                });

                return NextResponse.json({
                    success: true,
                    jobId: job.id,
                    message: 'Análisis encolado con éxito',
                    correlationId
                }, { status: 202 });

            } catch (error: unknown) {
                return handleApiError(error, 'TECHNICAL_ENTITIES_ANALYZE_ASYNC', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/analyze', thresholdMs: 2000 });
