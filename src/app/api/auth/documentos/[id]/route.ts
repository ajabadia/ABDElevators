import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
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
 * DELETE /api/auth/documentos/[id]
 * Elimina un documento personal del usuario.
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
        const db = await connectDB();
        const user = await db.collection('usuarios').findOne({ email: session.user.email });
        if (!user) throw new NotFoundError('Usuario no encontrado');

        const doc = await db.collection('documentos_usuarios').findOne({
            _id: new ObjectId(id),
            usuario_id: user._id.toString() // Seguridad: solo el dueño puede borrar
        });

        if (!doc) {
            throw new NotFoundError('Documento no encontrado o no autorizado');
        }

        // Borrar de Cloudinary
        await cloudinary.uploader.destroy(doc.cloudinary_public_id);

        // Borrar de BD
        await db.collection('documentos_usuarios').deleteOne({ _id: new ObjectId(id) });

        await logEvento({
            nivel: 'INFO',
            origen: 'API_DOCS_USUARIO',
            accion: 'DELETE_DOC',
            mensaje: `Documento borrado por ${user.email}: ${doc.nombre_original}`,
            correlacion_id,
            detalles: { docId: id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_DOCS_USUARIO',
            accion: 'DELETE_DOC_ERROR',
            mensaje: error.message,
            correlacion_id,
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
                nivel: 'WARN',
                origen: 'API_DOCS_USUARIO',
                accion: 'PERFORMANCE_SLA_VIOLATION',
                mensaje: `DELETE /api/auth/documentos/[id] tomó ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
