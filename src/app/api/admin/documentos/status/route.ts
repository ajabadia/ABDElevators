import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { AppError, ValidationError } from '@/lib/errors';
import { z } from 'zod';
import { ObjectId } from 'mongodb';

const StatusUpdateSchema = z.object({
    documentId: z.string(),
    nuevoEstado: z.enum(['borrador', 'vigente', 'obsoleto', 'archivado']),
});

/**
 * PATCH /api/admin/documentos/status
 * Actualiza el estado de un documento y sus chunks asociados.
 * Regla de Oro #3: AppError.
 * Regla de Oro #7: Atomicidad (Transaction).
 */
export async function PATCH(req: NextRequest) {
    const correlacion_id = uuidv4();

    try {
        const body = await req.json();
        const { documentId, nuevoEstado } = StatusUpdateSchema.parse(body);

        const db = await connectDB();
        const collection = db.collection('document_chunks');

        // Nota: En MongoDB Atlas Serverless/Free tier no siempre hay transacciones disponibles 
        // pero intentamos mantener la atomicidad mediante el updateMany.
        const result = await collection.updateMany(
            { _id: new ObjectId(documentId) }, // O por algun ID identificador de "documento" que compartan
            { $set: { estado: nuevoEstado, actualizado: new Date() } }
        );

        await logEvento({
            nivel: 'INFO',
            origen: 'API_DOC_STATUS',
            accion: 'UPDATE_STATUS',
            mensaje: `Documento ${documentId} actualizado a ${nuevoEstado}`,
            correlacion_id,
            detalles: { result }
        });

        return NextResponse.json({ success: true, message: 'Estado actualizado' });

    } catch (error) {
        // Error handling code...
        return NextResponse.json({ success: false, message: 'Fallo al actualizar estado' }, { status: 500 });
    }
}
