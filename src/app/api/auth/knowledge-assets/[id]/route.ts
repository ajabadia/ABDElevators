import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { connectDB, connectAuthDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { v2 as cloudinary } from 'cloudinary';
import { AppError, NotFoundError } from '@/lib/errors';

// Configurar Cloudinary para borrado
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * DELETE /api/auth/knowledge-assets/[id]
 * Soft-Delete de un activo de conocimiento (Compliance).
 * SLA: P95 < 1000ms
 */
async function DELETE_internal(
    req: NextRequest,
    paramsContext: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await enforcePermission('knowledge:asset', 'write');

        const { id } = await paramsContext.params;

        // 🛡️ SECURITY: Validate format before ObjectId constructor
        const { ObjectIdSchema } = await import('@/lib/schemas/common');
        ObjectIdSchema.parse(id);
        const tenantId = session.user.tenantId;

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });

        if (!user) throw new NotFoundError('Usuario no encontrado');

        const db = await connectDB();

        // 1. Soft Delete in User Documents (Corrected Collection)
        const result = await db.collection('user_documents').findOneAndUpdate(
            {
                _id: new ObjectId(id),
                userId: user._id.toString(), // Security: Only owner
                tenantId
            },
            {
                $set: {
                    status: 'deleted',
                    deletedAt: new Date(),
                    deletedBy: session.user.email
                }
            }
        );

        if (!result) {
            throw new NotFoundError('Documento no encontrado o no autorizado');
        }

        // NOTE: Soft Delete (Compliance). Cleaning job required for hard delete.

        await logEvento({
            level: 'INFO',
            source: 'API_USER_DOCS',
            action: 'SOFT_DELETE_DOC',
            message: `Documento marcado como eliminado: ${id}`,
            correlationId: correlacion_id,
            details: { docId: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        const message = error instanceof Error ? error.message : 'Error al borrar documento';
        await logEvento({
            level: 'ERROR',
            source: 'API_DOCS_USUARIO',
            action: 'DELETE_DOC_ERROR',
            message,
            correlationId: correlacion_id,
            details: { stack: error instanceof Error ? error.stack : undefined }
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, message).toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 1000) {
            await logEvento({
                level: 'WARN',
                source: 'API_DOCS_USUARIO',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `DELETE /api/auth/documentos/[id] tomó ${duracion}ms`,
                correlationId: correlacion_id,
                details: { duracion_ms: duracion }
            });
        }
    }
}

export const DELETE = withPerformanceSLA(DELETE_internal, { endpoint: 'DELETE /api/auth/knowledge-assets/[id]', thresholdMs: 1000 });
