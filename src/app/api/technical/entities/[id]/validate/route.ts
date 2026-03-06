import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { ValidationSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

async function POST_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const session = await enforcePermission('technical:analysis', 'write');
        const { id: entityId } = context.params;

        // 🛡️ SECURITY: Validate format before ObjectId constructor
        const { ObjectIdSchema } = await import('@/lib/schemas/common');
        ObjectIdSchema.parse(entityId);

        const tenantId = session.user.tenantId;

        const body = await req.json();
        const validated = ValidationSchema.parse({
            ...body, entityId, tenantId, validatedBy: session.user.id, technicianName: session.user.name,
        });

        const db = await connectDB();
        const entity = await db.collection('entities').findOne({ _id: new ObjectId(entityId), tenantId });

        if (!entity) throw new AppError('NOT_FOUND', 404, 'Entidad no encontrada');

        const result = await db.collection('human_validations').insertOne({ ...validated, timestamp: new Date() });

        if (validated.generalStatus === 'APPROVED') {
            await db.collection('entities').updateOne(
                { _id: new ObjectId(entityId) },
                { $set: { isValidated: true, validatedBy: session.user.id, validatedAt: new Date() } }
            );
        }

        const durationMs = Date.now() - start;
        await logEvento({
            level: 'INFO', source: 'VALIDATION_ENDPOINT', action: 'VALIDATION_SAVED',
            message: `Validación ${validated.generalStatus} para ${entityId}`,
            correlationId, tenantId, details: { durationMs }
        });

        return NextResponse.json({ success: true, validationId: result.insertedId.toString() });

    } catch (error: unknown) {
        return handleApiError(error, 'VALIDATION_ENDPOINT', correlationId);
    }
}

async function GET_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('technical:analysis', 'read');
        const { id: entityId } = context.params;
        const tenantId = session.user.tenantId;

        const db = await connectDB();
        const validations = await db.collection('human_validations').find({ entityId, tenantId }).sort({ timestamp: -1 }).toArray();

        return NextResponse.json({ success: true, validations });
    } catch (error: unknown) {
        return handleApiError(error, 'VALIDATION_ENDPOINT', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/validate', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/entities/[id]/validate', thresholdMs: 1000 });
