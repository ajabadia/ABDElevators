import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { DocumentChunkSchema, DocumentoTecnicoSchema } from '@/lib/schemas';
import { ValidationError, AppError, DatabaseError } from '@/lib/errors';
import { generateEmbedding, extractModelsWithGemini } from '@/lib/llm';
import { extractTextFromPDF } from '@/lib/pdf-utils';
import { chunkText } from '@/lib/chunk-utils';
import { uploadRAGDocument } from '@/lib/cloudinary';
import { z } from 'zod';
import crypto from 'crypto';

// Schema para los metadatos del upload
const IngestMetadataSchema = z.object({
    tipo: z.string().min(1),
    version: z.string().min(1),
});

/**
 * POST /api/admin/ingest
 * Procesa un archivo PDF, lo divide en chunks y genera embeddings.
 * SLA: P95 < 20000ms (debido a extracción, embeddings e inserción masiva)
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        // Regla #9: Security Check
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado para ingestion');
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const metadataRaw = {
            tipo: formData.get('tipo'),
            version: formData.get('version'),
        };

        // Regla #2: Zod First
        if (!file) {
            throw new ValidationError('No se ha proporcionado ningún archivo');
        }
        const metadata = IngestMetadataSchema.parse(metadataRaw);

        await logEvento({
            nivel: 'INFO',
            origen: 'API_INGEST',
            accion: 'START',
            mensaje: `Iniciando ingesta de ${file.name}`,
            correlacion_id,
            detalles: { filename: file.name, size: file.size }
        });

        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Subir PDF a Cloudinary
        const cloudinaryResult = await uploadRAGDocument(buffer, file.name);

        // 2. Extraer texto
        const text = await extractTextFromPDF(buffer);

        // 3. IA: Extraer modelos
        const modelosDetectados = await extractModelsWithGemini(text, correlacion_id);
        const modeloPrincipal = modelosDetectados.length > 0 ? modelosDetectados[0].modelo : 'DESCONOCIDO';

        // 4. Chunking
        const chunks = await chunkText(text);

        // 5. Generar Embeddings e Indexar (Regla #7: Atómico/Database Consistency)
        const db = await connectDB();
        const documentChunksCollection = db.collection('document_chunks');
        const documentosTecnicosCollection = db.collection('documentos_tecnicos');

        // 5.1. Guardar metadatos del documento
        const documentoMetadata = {
            nombre_archivo: file.name,
            tipo_componente: metadata.tipo,
            modelo: modeloPrincipal,
            version: metadata.version,
            fecha_revision: new Date(),
            estado: 'vigente' as const,
            cloudinary_url: cloudinaryResult.secureUrl,
            cloudinary_public_id: cloudinaryResult.publicId,
            total_chunks: chunks.length,
            creado: new Date(),
        };

        const validatedDocumentoMetadata = DocumentoTecnicoSchema.parse(documentoMetadata);
        await documentosTecnicosCollection.insertOne(validatedDocumentoMetadata);

        // 5.2. Procesar chunks
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
                cloudinary_url: cloudinaryResult.secureUrl,
                cloudinary_public_id: cloudinaryResult.publicId,
                creado: new Date(),
            };

            const validatedChunk = DocumentChunkSchema.parse(documentChunk);
            await documentChunksCollection.insertOne(validatedChunk);
        }

        return NextResponse.json({
            success: true,
            correlacion_id,
            message: 'Documento procesado correctamente',
            chunks: chunks.length
        });

    } catch (error: any) {
        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Metadatos de ingesta inválidos', error.errors).toJSON(),
                { status: 400 }
            );
        }
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_INGEST',
            accion: 'ERROR_FATAL',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error crítico en ingesta').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 20000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_INGEST',
                accion: 'SLA_VIOLATION',
                mensaje: `Ingesta pesada: ${duracion}ms`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }
    }
}
