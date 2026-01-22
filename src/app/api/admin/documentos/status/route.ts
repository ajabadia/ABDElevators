import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

const StatusUpdateSchema = z.object({
    documentId: z.string(),
    nuevoEstado: z.enum(['borrador', 'vigente', 'obsoleto', 'archivado']),
});

/**
 * PATCH /api/admin/documentos/status
 * Actualiza el estado de un documento y sus chunks asociados.
 * SLA: P95 < 1000ms
 */
export async function PATCH(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const body = await req.json();
        const { documentId, nuevoEstado } = StatusUpdateSchema.parse(body);

        const db = await connectDB();

        // 1. Verificar existencia del documento
        const documento = await db.collection('documentos_tecnicos').findOne({
            _id: new ObjectId(documentId)
        });

        if (!documento) {
            throw new NotFoundError('Documento no encontrado');
        }

        const publicId = documento.cloudinary_public_id;

        // 2. Regla #7: Atómico. Actualizamos el documento maestro y sus chunks
        // Actualizar el documento maestro
        await db.collection('documentos_tecnicos').updateOne(
            { _id: new ObjectId(documentId) },
            { $set: { estado: nuevoEstado, actualizado: new Date() } }
        );

        // Actualizar chunks asociados
        const chunkFilter = publicId
            ? { cloudinary_public_id: publicId }
            : { origen_doc: documento.nombre_archivo };

        const resultChunks = await db.collection('document_chunks').updateMany(
            chunkFilter,
            { $set: { estado: nuevoEstado, actualizado: new Date() } }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'API_DOC_STATUS',
            accion: 'UPDATE_STATUS',
            mensaje: `Documento ${documento.nombre_archivo} actualizado a ${nuevoEstado}`,
            correlacion_id,
            detalles: { documentId, nuevoEstado, chunksActualizados: resultChunks.modifiedCount }
        });

        return NextResponse.json({
            success: true,
            message: `Estado actualizado a ${nuevoEstado}`,
            chunksActualizados: resultChunks.modifiedCount
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Datos de actualización de estado inválidos', error.errors).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_DOC_STATUS',
            accion: 'UPDATE_STATUS_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Fallo al actualizar estado').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 1000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_DOC_STATUS',
                accion: 'SLA_VIOLATION',
                mensaje: `Actualización de estado lenta: ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
