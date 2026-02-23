
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logEvento } from "@/lib/logger";
import { AppError, ValidationError, DatabaseError, NotFoundError, handleApiError } from "@/lib/errors";
import { ValidationSchema, ItemValidationSchema } from '@/lib/schemas';

const ParamsSchema = z.object({
    id: z.string(),
});

/**
 * POST /api/entities/[id]/checklist/validate
 * Persists technician validation for a specific checklist item.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id: entityId } = await context.params;
    const correlationId = uuidv4();
    const start = Date.now();

    try {
        // 1. Auth & Tenant Check
        const session = await auth();
        if (!session) throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        const tenantId = session.user.tenantId;

        // 2. Body Validation (Zod First)
        const body = await request.json();
        const parsedBody = ItemValidationSchema.parse(body);

        // 3. Database Operation
        const db = await connectDB();

        // 🛡️ Tenant Isolation & Existence Check
        const existing = await db.collection('extracted_checklists').findOne({
            entityId: entityId.toString(),
            tenantId
        });

        if (!existing) {
            throw new NotFoundError(`Checklist para la entidad ${entityId} no encontrado`);
        }

        // 4. Atomic Update of Validation
        const updateKey = `validations.${parsedBody.itemId}`;
        await db.collection('extracted_checklists').updateOne(
            { entityId: entityId.toString(), tenantId },
            {
                $set: {
                    [updateKey]: {
                        ...parsedBody,
                        technicianId: session.user.id,
                        updatedAt: new Date()
                    },
                    updatedAt: new Date()
                }
            }
        );

        // 5. Logging
        const durationMs = Date.now() - start;
        await logEvento({
            level: 'INFO',
            source: 'CHECKLIST_VALIDATION',
            action: 'UPDATE',
            message: `Validated item ${parsedBody.itemId} for entity ${entityId}`,
            correlationId,
            details: { durationMs, status: parsedBody.status }
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        return handleApiError(error, 'CHECKLIST_VALIDATION', correlationId);
    }
}
