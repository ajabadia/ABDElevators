import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { AppError, NotFoundError } from '@/lib/errors';
import { deletePDFFromCloudinary } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * DELETE /api/admin/documentos/[id]
 * Elimina fisicamente un documento de la DB y de Cloudinary.
 * Tambien elimina todos los chunks asociados.
 * SLA: P95 < 2000ms
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Solo administradores pueden eliminar documentos');
        }

        const { id } = await params;
        const db = await connectDB();

        // 1. Encontrar el documento para obtener el public_id de Cloudinary
        const documento = await db.collection('documentos_tecnicos').findOne({
            _id: new ObjectId(id)
        });

        if (!documento) {
            throw new NotFoundError('Documento no encontrado');
        }

        const publicId = documento.cloudinary_public_id;

        // 2. Operacion Atomica (Simulada via try/catch y limpieza manual ya que MongoDB Atlas free no siempre soporta multi-doc trans)
        // En produccion usariamos session.withTransaction()

        // 2.1 Eliminar de Cloudinary si existe
        if (publicId) {
            try {
                await deletePDFFromCloudinary(publicId);
            } catch (cloudErr) {
                await logEvento({
                    nivel: 'WARN',
                    origen: 'API_DOC_DELETE',
                    accion: 'CLOUDINARY_DELETE_FAIL',
                    mensaje: `No se pudo eliminar de Cloudinary, publicId: ${publicId}. Continuando con DB.`,
                    correlacion_id,
                    detalles: { error: (cloudErr as Error).message }
                });
            }
        }

        // 2.2 Eliminar chunks asociados
        // Usamos el publicId como clave de union si existe, sino el nombre de archivo (legacy fallback)
        const chunkFilter = publicId
            ? { cloudinary_public_id: publicId }
            : { origen_doc: documento.nombre_archivo };

        const chunkDeleteResult = await db.collection('document_chunks').deleteMany(chunkFilter);

        // 2.3 Eliminar el documento maestro
        const docDeleteResult = await db.collection('documentos_tecnicos').deleteOne({
            _id: new ObjectId(id)
        });

        await logEvento({
            nivel: 'INFO',
            origen: 'API_DOC_DELETE',
            accion: 'SUCCESS',
            mensaje: `Documento ${documento.nombre_archivo} eliminado correctamente`,
            correlacion_id,
            detalles: {
                documentId: id,
                chunksEliminados: chunkDeleteResult.deletedCount,
                docEliminado: docDeleteResult.deletedCount
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Documento y fragmentos eliminados correctamente',
            details: {
                chunks: chunkDeleteResult.deletedCount
            }
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_DOC_DELETE',
            accion: 'ERROR_FATAL',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error critico al eliminar documento').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 2000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_DOC_DELETE',
                accion: 'SLA_VIOLATION',
                mensaje: `Eliminacion lenta: ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
