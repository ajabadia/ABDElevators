import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getPDFDownloadUrl } from '@/lib/cloudinary';
import { logEvento } from '@/lib/logger';
import { ObjectId } from 'mongodb';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * GET /api/admin/documentos/[id]/download
 * Descarga el PDF original desde Cloudinary
 * SLA: P95 < 500ms
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'INGENIERIA' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado para descarga');
        }

        const { id } = await params;
        const db = await connectDB();
        const documento = await db.collection('documentos_tecnicos').findOne({
            _id: new ObjectId(id)
        });

        if (!documento) {
            throw new NotFoundError('Documento no encontrado');
        }

        if (!documento.cloudinary_public_id) {
            throw new ValidationError('Este documento no tiene archivo PDF almacenado');
        }

        const downloadUrl = getPDFDownloadUrl(documento.cloudinary_public_id);

        await logEvento({
            nivel: 'INFO',
            origen: 'API_DOWNLOAD',
            accion: 'PDF_DOWNLOAD',
            mensaje: `Descarga de PDF: ${documento.nombre_archivo}`,
            correlacion_id,
            detalles: { documento_id: id }
        });

        return NextResponse.redirect(downloadUrl);
    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_DOWNLOAD',
            accion: 'DOWNLOAD_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error al descargar el PDF').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 500) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_DOWNLOAD',
                accion: 'SLA_VIOLATION',
                mensaje: `Descarga lenta (redirect): ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
