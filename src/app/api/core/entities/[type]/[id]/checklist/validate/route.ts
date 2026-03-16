import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from '@/lib/auth';
import { connectDB } from "@/lib/db";
import { NotFoundError, handleApiError } from "@/lib/errors";
import { ItemValidationSchema } from '@/lib/schemas';
import { withCorrelation } from '@/lib/logger/with-correlation';

/**
 * POST /api/entities/[id]/checklist/validate
 * Persists technician validation for a specific checklist item.
 */
async function POST_internal(request: NextRequest, context: { params: { id: string } }) {
    return withCorrelation(
        { level: 'INFO', source: 'CHECKLIST_VALIDATION', action: 'UPDATE' },
        async ({ log, correlationId }) => {
            const start = Date.now();
            try {
                const session = await requirePermission('technical:analysis', 'write');
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

                await log({
                    message: `Validated item ${parsedBody.itemId} for ${entityId}`,
                    details: { durationMs: Date.now() - start, status: parsedBody.status }
                });

                return NextResponse.json({ success: true, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'CHECKLIST_VALIDATION', correlationId);
            }
        }
    );
}

export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/entities/[id]/checklist/validate', thresholdMs: 1000 });
