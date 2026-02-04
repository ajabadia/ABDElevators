import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { ValidationSchema } from '@/lib/schemas';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

/**
 * POST /api/entities/[id]/validate
 * Saves human validation for an entity (Phase 6.4)
 * SLA: P95 < 300ms
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id: entityId } = await params;
        const body = await req.json();

        // Validate with Zod (Golden Rule #2)
        const validated = ValidationSchema.parse({
            ...body,
            entityId,
            tenantId: session.user.tenantId,
            validatedBy: session.user.id,
            technicianName: session.user.name,
        });

        const db = await connectDB();

        // Verify entity exists and belongs to the tenant
        const entity = await db.collection('entities').findOne({
            _id: new ObjectId(entityId),
            tenantId: validated.tenantId
        });

        if (!entity) {
            throw new AppError('NOT_FOUND', 404, 'Entidad no encontrada');
        }

        // Save validation in audit trail
        const result = await db.collection('human_validations').insertOne({
            ...validated,
            timestamp: new Date(),
        });

        // Update entity status if fully approved
        if (validated.generalStatus === 'APPROVED') {
            await db.collection('entities').updateOne(
                { _id: new ObjectId(entityId) },
                {
                    $set: {
                        isValidated: true,
                        validatedBy: session.user.id,
                        validatedAt: new Date(),
                    }
                }
            );
        }

        const durationMs = Date.now() - start;

        await logEvento({
            level: 'INFO',
            source: 'VALIDATION_ENDPOINT',
            action: 'VALIDATION_SAVED',
            message: `Validación ${validated.generalStatus} para entidad ${entityId}`,
            correlationId,
            tenantId: validated.tenantId,
            details: {
                entityId,
                generalStatus: validated.generalStatus,
                validatedItems: validated.items.length,
                validationTime: validated.validationTime,
                durationMs
            }
        });

        if (durationMs > 300) {
            await logEvento({
                level: 'WARN',
                source: 'VALIDATION_ENDPOINT',
                action: 'SLA_EXCEEDED',
                message: `Validación tardó ${durationMs}ms (SLA: 300ms)`,
                correlationId,
                details: { durationMs }
            });
        }

        return NextResponse.json({
            success: true,
            validationId: result.insertedId.toString(),
            generalStatus: validated.generalStatus,
            validatedItems: validated.items.length
        });

    } catch (error: any) {
        const durationMs = Date.now() - start;
        await logEvento({
            level: 'ERROR',
            source: 'VALIDATION_ENDPOINT',
            action: 'VALIDATION_ERROR',
            message: error.message,
            correlationId,
            details: { durationMs },
            stack: error.stack
        });

        return handleApiError(error, 'VALIDATION_ENDPOINT', correlationId);
    }
}

/**
 * GET /api/entities/[id]/validate
 * Gets validation history for an entity
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id: entityId } = await params;
        const tenantId = session.user.tenantId;

        const db = await connectDB();

        // Get all validations for the entity
        const validations = await db.collection('human_validations')
            .find({ entityId, tenantId })
            .sort({ timestamp: -1 })
            .toArray();

        await logEvento({
            level: 'DEBUG',
            source: 'VALIDATION_ENDPOINT',
            action: 'HISTORY_ACCESSED',
            message: `Consultado historial de validaciones para entidad ${entityId}`,
            correlationId,
            tenantId,
            details: { entityId, validationsFound: validations.length }
        });

        return NextResponse.json({
            success: true,
            validations,
            total: validations.length
        });

    } catch (error: any) {
        await logEvento({
            level: 'ERROR',
            source: 'VALIDATION_ENDPOINT',
            action: 'HISTORY_ERROR',
            message: error.message,
            correlationId,
            stack: error.stack
        });

        return handleApiError(error, 'VALIDATION_ENDPOINT', correlationId);
    }
}
