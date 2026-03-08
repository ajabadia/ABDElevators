import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { WorkshopService } from '@/services/ops/workshop-service';
import { getTenantCollection } from '@/lib/db-tenant';
import { NextResponse, NextRequest } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { requirePermission } from '@/lib/auth';
import { CreateWorkshopOrderSchema } from '@/lib/schemas';

async function POST_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await requirePermission('technical:analysis', 'write');
        const body = await req.json();
        const validated = CreateWorkshopOrderSchema.parse(body);

        const collection = await getTenantCollection('entities', session as any);
        const result = await collection.insertOne({
            type: 'WORKSHOP_ORDER', description: validated.description, priority: validated.priority,
            metadata: validated.metadata || {}, status: 'PENDING_ANALYSIS', tenantId: session.user.tenantId,
            createdAt: new Date(), createdBy: session.user.id, industry: 'GENERIC'
        });

        const entityId = result.insertedId.toString();
        const analysis = await WorkshopService.analyzeAndEnrichOrder(entityId, validated.description, session.user.tenantId, correlationId, session);

        await logEvento({ level: 'INFO', source: 'API_WORKSHOP', action: 'CREATE_ORDER', message: `Order created: ${entityId}`, correlationId });
        return NextResponse.json({ success: true, entityId, analysis });
    } catch (error: unknown) {
        return handleApiError(error, 'API_WORKSHOP_ORDER', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/workshop/orders', thresholdMs: 2000 });
