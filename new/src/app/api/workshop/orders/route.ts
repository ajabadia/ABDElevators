import { auth } from '@/lib/auth';
import { CreateWorkshopOrderSchema } from '@/lib/schemas/workshop';
import { WorkshopService } from '@/lib/services/workshop-service';
import { getTenantCollection } from '@/lib/db-tenant';
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { randomUUID } from 'crypto';

/**
 * ⚡ FASE 128.2: Workshop Order Creation & Analysis API
 * POST /api/workshop/orders
 */
export async function POST(req: Request) {
    const correlationId = randomUUID();
    const session = await auth();

    // 1. Auth Check (Admin/Technical)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Future: Check specific role permissions if needed (e.g. WORKSHOP_MANAGER)

    try {
        const body = await req.json();

        // 2. Validate Body
        const validated = CreateWorkshopOrderSchema.parse(body);

        // 3. Create Entity (Optimistic creation)
        const collection = await getTenantCollection('entities', session);

        const entityFn = {
            type: 'WORKSHOP_ORDER', // Specialized entity type
            description: validated.description,
            priority: validated.priority,
            metadata: validated.metadata || {},
            status: 'PENDING_ANALYSIS',
            tenantId: session.user.tenantId,
            createdAt: new Date(),
            createdBy: session.user.id,
            industry: 'ELEVATORS' // Default vertical for now
        };

        const result = await collection.insertOne(entityFn);
        const entityId = result.insertedId.toString();

        await logEvento({
            level: 'INFO',
            source: 'API_WORKSHOP',
            action: 'CREATE_ORDER',
            message: `Workshop order created: ${entityId}`,
            tenantId: session.user.tenantId,
            correlationId,
            details: { entityId, priority: validated.priority }
        });

        // 4. Trigger Analysis (Sync for demo/UX speed, could be async job)
        let analysis = null;
        try {
            analysis = await WorkshopService.analyzeAndEnrichOrder(
                entityId,
                validated.description,
                session.user.tenantId,
                correlationId,
                session
            );
        } catch (analysisError) {
            // Log but don't fail the creation request completely if analysis fails
            console.error('Workshop analysis failed:', analysisError);
            // Status remains PENDING_ANALYSIS (or we could update to ANALYSIS_FAILED)
            // Client will see entityId but no analysis
        }

        return NextResponse.json({
            success: true,
            entityId,
            analysis,
            message: 'Order created and analyzed successfully'
        }, { status: 201 });

    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        if (error instanceof Error) { // Zod error or other
            return NextResponse.json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: error.message }
            }, { status: 400 });
        }

        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
