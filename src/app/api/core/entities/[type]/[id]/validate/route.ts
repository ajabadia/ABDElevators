import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { ValidationSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

async function POST_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    return withCorrelation(
        { level: 'INFO', source: 'VALIDATION_ENDPOINT', action: 'VALIDATE_ENTITY' },
        async ({ log, correlationId }) => {
            const start = Date.now();

            try {
                const session = await requirePermission('technical:analysis', 'write');
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

                const result = await db.collection('human_validations').insertOne({ ...validated, timestamp: new Date() } as any);

                if (validated.generalStatus === 'APPROVED') {
                    await db.collection('entities').updateOne(
                        { _id: new ObjectId(entityId) },
                        { $set: { isValidated: true, validatedBy: session.user.id, validatedAt: new Date() } }
                    );
                }

                const durationMs = Date.now() - start;
                await log({
                    message: `Validación ${validated.generalStatus} para ${entityId}`,
                    details: { durationMs },
                    tenantId
                });

                return NextResponse.json({ success: true, validationId: result.insertedId.toString(), correlationId });

            } catch (error: unknown) {
                return handleApiError(error, 'API_TECHNICAL_ENTITIES_VALIDATE_POST', correlationId);
            }
        }
    );
}

async function GET_internal(
    req: NextRequest,
    context: { params: { id: string } }
) {
    return withCorrelation(
        { level: 'INFO', source: 'VALIDATION_ENDPOINT', action: 'GET_VALIDATIONS' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('technical:analysis', 'read');
                const { id: entityId } = context.params;
                const tenantId = session.user.tenantId;

                const db = await connectDB();
                const validations = await db.collection('human_validations').find({ entityId, tenantId }).sort({ timestamp: -1 }).toArray();

                return NextResponse.json({ success: true, validations, correlationId });
            } catch (error: unknown) {
                return handleApiError(error, 'API_TECHNICAL_ENTITIES_VALIDATE_GET', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/technical/entities/[id]/validate', thresholdMs: 1000 });
export const POST = withPerformanceSLA(POST_internal, { endpoint: 'POST /api/technical/entities/[id]/validate', thresholdMs: 1000 });
