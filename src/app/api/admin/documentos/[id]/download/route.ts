import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getPDFDownloadUrl } from '@/lib/cloudinary';
import { logEvento } from '@/lib/logger';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const db = await connectDB();
        const documento = await db.collection('documentos_tecnicos').findOne({
            _id: new (require('mongodb').ObjectId)(params.id)
        });

        if (!documento) {
            return NextResponse.json(
                { error: 'Documento no encontrado' },
                { status: 404 }
            );
        }

        if (!documento.cloudinary_public_id) {
            return NextResponse.json(
                { error: 'Este documento no tiene archivo PDF almacenado' },
                { status: 404 }
            );
        }

        const downloadUrl = getPDFDownloadUrl(documento.cloudinary_public_id);

        await logEvento({
            nivel: 'INFO',
            origen: 'API_DOWNLOAD',
            accion: 'PDF_DOWNLOAD',
            mensaje: `Descarga de PDF: ${documento.nombre_archivo}`,
            correlacion_id: `download-${Date.now()}`,
            detalles: { documento_id: params.id }
        });

        // Redirigir a la URL de Cloudinary
        return NextResponse.redirect(downloadUrl);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        return NextResponse.json(
            { error: 'Error al descargar el PDF' },
            { status: 500 }
        );
    }
}
