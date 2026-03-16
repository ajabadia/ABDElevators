import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { WorkshopService } from '@/services/ops/workshop-service';
import { getTenantCollection } from '@/lib/db-tenant';
import { NextResponse, NextRequest } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { requirePermission } from '@/lib/auth';
import { CreateWorkshopOrderSchema } from '@/lib/schemas';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function POST_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_WORKSHOP', action: 'CREATE_ORDER' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:analysis', 'write');
                const body = await req.json();
                const validated = CreateWorkshopOrderSchema.parse(body);

                const tenantId = session.user.tenantId;

                await log({
                    message: 'Creating new workshop order',
                    details: { priority: validated.priority },
                    tenantId
                });

                const collection = await getTenantCollection('orders', session as any);
                const result = await collection.insertOne({
                    type: 'WORKSHOP_ORDER',
                    description: validated.description,
                    priority: validated.priority,
                    metadata: validated.metadata || {},
                    status: 'PENDING_ANALYSIS',
                    tenantId,
                    createdAt: new Date(),
                    createdBy: session.user.id,
                    industry: 'GENERIC'
                });

                const entityId = result.insertedId.toString();

                await log({
                    message: `Workshop order created: ${entityId}. Initiating analysis.`,
                    details: { entityId },
                    tenantId
                });

                const analysis = await WorkshopService.analyzeAndEnrichOrder(
                    entityId, 
                    validated.description, 
                    tenantId, 
                    correlationId, 
                    session
                );

                await log({
                    message: 'Workshop order created and analysis initiated',
                    details: { entityId, analysisJobId: !!analysis },
                    tenantId
                });

                return NextResponse.json({ 
                    success: true, 
                    entityId, 
                    analysis,
                    correlationId 
                });
            } catch (error: unknown) {
                return handleApiError(error, 'API_WORKSHOP_ORDER_POST', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/workshop/orders', thresholdMs: 2000 });
