import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError } from '@/lib/errors';
import { TenantIdSchema, EntityIdSchema } from '@/lib/schemas';

interface GraphFinding {
    source: 'extraction' | 'risk_analysis' | 'validation';
    type: string;
    model: string;
    field?: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    originalValue?: any;
    correctedValue?: any;
    status?: string;
}

interface GraphState {
    messages: { role: string, content: string }[];
    entityId: string;
    tenantId: string;
    correlationId: string;
    industry: string;
    environment: string;
    confidence_score?: number;
    findings?: GraphFinding[];
}

async function GET_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await requirePermission('technical:analysis', 'execute');
        const { id } = context.params;

        // 🛡️ SECURITY: Validate format
        const { ObjectIdSchema } = await import('@/lib/schemas/common');
        ObjectIdSchema.parse(id);

        const tenantId = TenantIdSchema.parse(session.user.tenantId);

        // 1. Fetch entity to ensure it exists and get necessary data
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

        // 3. Update entity status to 'processing'
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

        // ⚡ SLA: Immediate response
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

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/analyze', thresholdMs: 2000 });
