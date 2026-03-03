import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { enforcePermission } from '@/lib/guardian-guard';
import { connectDB } from "@/lib/db";
import { logEvento } from "@/lib/logger";
import { AppError, NotFoundError, handleApiError } from "@/lib/errors";
import { ItemValidationSchema } from '@/lib/schemas';

/**
 * POST /api/entities/[id]/checklist/validate
 * Persists technician validation for a specific checklist item.
 */
async function POST_internal(request: NextRequest, context: { params: { id: string } }) {
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        const session = await enforcePermission('technical:analysis', 'write');
        const { id: entityId } = context.params;
        const tenantId = session.user.tenantId;

        const body = await request.json();
        const parsedBody = ItemValidationSchema.parse(body);

        const db = await connectDB();
        const existing = await db.collection('extracted_checklists').findOne({ entityId: entityId.toString(), tenantId });

        if (!existing) throw new NotFoundError(`Checklist para la entidad ${entityId} no encontrado`);

        const updateKey = `validations.${parsedBody.itemId}`;
        await db.collection('extracted_checklists').updateOne(
            { entityId: entityId.toString(), tenantId },
            {
                $set: {
                    [updateKey]: { ...parsedBody, technicianId: session.user.id, updatedAt: new Date() },
                    updatedAt: new Date()
                }
            }
        );

        const durationMs = Date.now() - start;
        await logEvento({
            level: 'INFO',
            source: 'CHECKLIST_VALIDATION',
            action: 'UPDATE',
            message: `Validated item ${parsedBody.itemId} for ${entityId}`,
            correlationId,
            details: { durationMs, status: parsedBody.status }
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return handleApiError(error, 'CHECKLIST_VALIDATION', correlationId);
    }
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/entities/[id]/checklist/validate', thresholdMs: 1000 });
