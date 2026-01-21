import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { DocumentChunkSchema } from '@/lib/schemas';
import { ValidationError, AppError } from '@/lib/errors';
import { generateEmbedding, extractModelsWithGemini } from '@/lib/llm';
import { extractTextFromPDF } from '@/lib/pdf-utils';
import { chunkText } from '@/lib/chunk-utils';
import { z } from 'zod';
import { PROMPTS } from '@/lib/prompts';

// Schema para los metadatos del upload
const IngestMetadataSchema = z.object({
    tipo: z.string().min(1),
    version: z.string().min(1),
});

/**
 * POST /api/admin/ingest
 * Procesa un archivo PDF, lo divide en chunks y genera embeddings.
 * Regla de Oro #3: AppError.
 * Regla de Oro #8: Medir performance.
 */
export async function POST(req: NextRequest) {
    const correlacion_id = uuidv4();
    const inicio = Date.now();

    try {
        await logEvento({
            nivel: 'INFO',
            origen: 'API_INGEST',
            accion: 'RECEIVE_FILE',
            mensaje: 'Iniciando ingestión de documento',
            correlacion_id
        });

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const metadataRaw = {
            tipo: formData.get('tipo'),
            version: formData.get('version'),
        };

        // 1. Validar inputs (Regla #2)
        if (!file) {
            throw new ValidationError('No se ha proporcionado ningún archivo');
        }
        const metadata = IngestMetadataSchema.parse(metadataRaw);

        // 2. Extraer Texto (Regla #3)
        const text = await extractTextFromPDF(Buffer.from(await file.arrayBuffer()));

        // 3. Extraer modelos mencionados en el documento completo (Contexto Global)
        const modelosDetectados = await extractModelsWithGemini(text, correlacion_id);
        const modeloPrincipal = modelosDetectados.length > 0 ? modelosDetectados[0].modelo : 'DESCONOCIDO';

        // 4. Chunking (Estrategia RAG Profesional)
        const chunks = await chunkText(text);

        // 5. Generar Embeddings e Indexar
        const db = await connectDB();
        const collection = db.collection('document_chunks');

        for (const chunkText of chunks) {
            const embedding = await generateEmbedding(chunkText, correlacion_id);

            const documentChunk = {
                tipo_componente: metadata.tipo,
                modelo: modeloPrincipal,
                origen_doc: file.name,
                version_doc: metadata.version,
                fecha_revision: new Date(),
                texto_chunk: chunkText,
                embedding: embedding,
                creado: new Date(),
            };

            // Validar objeto final antes de insertar (Regla #2)
            const validatedChunk = DocumentChunkSchema.parse(documentChunk);
            await collection.insertOne(validatedChunk);
        }

        const duracion = Date.now() - inicio;
        await logEvento({
            nivel: 'INFO',
            origen: 'API_INGEST',
            accion: 'COMPLETED',
            mensaje: `Ingestión finalizada en ${duracion}ms`,
            correlacion_id,
            detalles: { duracion_ms: duracion, chunks: chunks.length }
        });

        return NextResponse.json({
            success: true,
            correlacion_id,
            message: 'Documento procesado correctamente',
            chunks: chunks.length
        });

    } catch (error) {
        const duration = Date.now() - inicio;
        let status = 500;
        let errorResponse = { success: false, message: 'Internal Server Error' };

        if (error instanceof z.ZodError) {
            status = 400;
            errorResponse = { success: false, message: 'Validación fallida', details: error.issues } as any;
        } else if (error instanceof AppError) {
            status = error.status;
            errorResponse = error.toJSON() as any;
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_INGEST',
            accion: 'ERROR',
            mensaje: error instanceof Error ? error.message : 'Error desconocido',
            correlacion_id,
            detalles: { duration_ms: duration },
            stack: error instanceof Error ? error.stack : undefined
        });

        return NextResponse.json(errorResponse, { status });
    }
}
