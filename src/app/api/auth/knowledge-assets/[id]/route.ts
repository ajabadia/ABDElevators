import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB, connectAuthDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { v2 as cloudinary } from 'cloudinary';
import { AppError, NotFoundError } from '@/lib/errors';
import crypto from 'crypto';

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
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id } = await params;

        // Session should have tenantId (from auth/next-auth logic)
        // If not, we might need to fetch it.
        // Assuming session.user has tenantId (as seen in other files)
        const tenantId = (session.user as any).tenantId;

        const authDb = await connectAuthDB();
        const user = await authDb.collection('users').findOne({ email: session.user.email });

        if (!user) throw new NotFoundError('Usuario no encontrado');

        const db = await connectDB();

        // 1. Soft Delete in User Documents (Corrected Collection)
        const result = await db.collection('user_documents').findOneAndUpdate(
            {
                _id: new ObjectId(id),
                userId: user._id.toString() // Security: Only owner
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
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            level: 'ERROR',
            source: 'API_DOCS_USUARIO',
            action: 'DELETE_DOC_ERROR',
            message: error.message, correlationId: correlacion_id,
            stack: error.stack
        });
        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al borrar documento').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 1000) {
            await logEvento({
                level: 'WARN',
                source: 'API_DOCS_USUARIO',
                action: 'PERFORMANCE_SLA_VIOLATION',
                message: `DELETE /api/auth/documentos/[id] tomó ${duracion}ms`, correlationId: correlacion_id,
                details: { duracion_ms: duracion }
            });
        }
    }
}
