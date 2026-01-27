import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { DocumentChunkSchema, DocumentoTecnicoSchema, AuditIngestSchema } from '@/lib/schemas';
import { ValidationError, AppError, DatabaseError } from '@/lib/errors';
import { generateEmbedding, extractModelsWithGemini, callGeminiMini } from '@/lib/llm';
import { extractTextFromPDF } from '@/lib/pdf-utils';
import { chunkText } from '@/lib/chunk-utils';
import { uploadRAGDocument } from '@/lib/cloudinary';
import { z } from 'zod';
import { PromptService } from '@/lib/prompt-service';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { UsageService } from '@/lib/usage-service';

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
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        // Regla #9: Headers for Audit
        const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const userEmail = session.user?.email || 'unknown';

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
        const tenantId = (session.user as any).tenantId || 'default_tenant';

        // 0. De-duplicación por MD5 (Ahorro de Tokens)
        const fileHash = crypto.createHash('md5').update(buffer).digest('hex');
        const db = await connectDB();
        const documentChunksCollection = db.collection('document_chunks');
        const documentosTecnicosCollection = db.collection('documentos_tecnicos');

        const existingDoc = await documentosTecnicosCollection.findOne({ archivo_md5: fileHash });

        if (existingDoc) {
            await logEvento({
                nivel: 'INFO',
                origen: 'API_INGEST',
                accion: 'DEDUPLICACION',
                mensaje: `Documento idéntico detectado (MD5: ${fileHash}). Clonando metadatos para tenant ${tenantId}.`,
                correlacion_id,
                detalles: { originalDocId: existingDoc._id, filename: file.name }
            });

            // Si ya existe para este mismo tenant, podemos retornar éxito directamente o actualizar fecha
            const currentTenantDoc = await documentosTecnicosCollection.findOne({
                archivo_md5: fileHash,
                tenantId
            });

            if (currentTenantDoc) {
                return NextResponse.json({
                    success: true,
                    correlacion_id,
                    message: "El documento ya estaba indexado para este tenant.",
                    chunks: currentTenantDoc.total_chunks,
                    isDuplicate: true
                });
            }

            // Si existe en otro tenant, clonamos la entrada de metadatos (pero con el nuevo tenantId)
            const newDocMetadata = {
                ...existingDoc,
                _id: undefined, // MongoDB generará uno nuevo
                tenantId,
                nombre_archivo: file.name,
                creado: new Date(),
                fecha_revision: new Date(),
                estado: 'vigente'
            };
            delete (newDocMetadata as any)._id; // Asegurar que sea nuevo

            await documentosTecnicosCollection.insertOne(newDocMetadata);

            // Clonamos los chunks (Aislamiento sagrado pero ahorro de tokens AI)
            const originalChunks = await documentChunksCollection.find({
                cloudinary_public_id: existingDoc.cloudinary_public_id
            }).toArray();

            if (originalChunks.length > 0) {
                const newChunks = originalChunks.map(chunk => ({
                    ...chunk,
                    _id: undefined,
                    tenantId,
                    origen_doc: file.name,
                    creado: new Date()
                }));
                // Eliminar _id de cada chunk para inserción masiva
                newChunks.forEach(c => delete (c as any)._id);

                await documentChunksCollection.insertMany(newChunks);
            }

            // --- TRACKING DE AHORRO (Visión 2.0) ---
            const estimatedSavedTokens = (originalChunks.length * 150) + 1000;
            await UsageService.trackDeduplicationSaving(tenantId, estimatedSavedTokens, correlacion_id);

            return NextResponse.json({
                success: true,
                correlacion_id,
                message: `Documento reutilizado por coincidencia de contenido (${originalChunks.length} fragmentos). Ahorro estimado: ${estimatedSavedTokens} tokens.`,
                chunks: originalChunks.length,
                isCloned: true,
                savings: estimatedSavedTokens
            });
            await UsageService.trackDeduplicationSaving(tenantId, estimatedSavedTokens, correlacion_id);

            // AUTO-AUDIT: Registro de duplicado (Ingesta eficiente)
            const dbRef = await connectDB();
            const auditEntry = {
                tenantId,
                performedBy: userEmail,
                ip,
                userAgent,
                filename: file.name,
                fileSize: file.size,
                md5: fileHash,
                docId: existingDoc?._id,
                correlacion_id,
                status: 'DUPLICATE' as const,
                details: {
                    chunks: originalChunks.length,
                    duration_ms: Date.now() - inicio,
                    savings_tokens: estimatedSavedTokens
                }
            };
            await dbRef.collection('audit_ingestion').insertOne(AuditIngestSchema.parse(auditEntry));

            return NextResponse.json({
                success: true,
                correlacion_id,
                message: `Documento reutilizado por coincidencia de contenido (${originalChunks.length} fragmentos). Ahorro estimado: ${estimatedSavedTokens} tokens.`,
                chunks: originalChunks.length,
                isCloned: true,
                savings: estimatedSavedTokens
            });
        }

        await logEvento({ nivel: 'DEBUG', origen: 'API_INGEST', accion: 'PROCESO', mensaje: `Archivo nuevo (MD5: ${fileHash}). Iniciando procesamiento completo.`, correlacion_id });

        // 1. Subir PDF a Cloudinary (Aislamiento por tenant)
        const cloudinaryResult = await uploadRAGDocument(buffer, file.name, tenantId);
        await logEvento({ nivel: 'DEBUG', origen: 'API_INGEST', accion: 'PROCESO', mensaje: 'Subido a Cloudinary', correlacion_id });

        // 2. Extraer texto
        const text = await extractTextFromPDF(buffer);
        await logEvento({ nivel: 'DEBUG', origen: 'API_INGEST', accion: 'PROCESO', mensaje: `Texto extraído: ${text.length} chars`, correlacion_id });

        // 2.1. Detectar Idioma (Phase 21.1)
        const { text: languagePrompt, model: langModel } = await PromptService.getRenderedPrompt(
            'LANGUAGE_DETECTOR',
            { text: text.substring(0, 2000) },
            tenantId
        );
        const detectedLang = (await callGeminiMini(languagePrompt, tenantId, { correlacion_id, model: langModel })).trim().toLowerCase().substring(0, 2);

        // 3. IA: Extraer modelos
        const modelosDetectados = await extractModelsWithGemini(text, tenantId, correlacion_id);
        const modeloPrincipal = modelosDetectados.length > 0 ? modelosDetectados[0].modelo : 'DESCONOCIDO';

        // 4. Chunking
        const chunks = await chunkText(text);

        // 5.1. Guardar metadatos del documento
        const documentoMetadata = {
            tenantId,
            nombre_archivo: file.name,
            tipo_componente: metadata.tipo,
            modelo: modeloPrincipal,
            version: metadata.version,
            fecha_revision: new Date(),
            language: detectedLang,
            estado: 'vigente' as const,
            cloudinary_url: cloudinaryResult.secureUrl,
            cloudinary_public_id: cloudinaryResult.publicId,
            archivo_md5: fileHash,
            total_chunks: chunks.length,
            creado: new Date(),
        };

        const validatedDocumentoMetadata = DocumentoTecnicoSchema.parse(documentoMetadata);
        await documentosTecnicosCollection.insertOne(validatedDocumentoMetadata);

        // 5.2. Procesar chunks con Dual-Indexing

        // 5.2. Procesar chunks con Dual-Indexing en batches para mejorar performance
        const { multilingualService } = await import('@/lib/multilingual-service');
        const BATCH_SIZE = 10;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (chunkText) => {
                // Si el idioma no es español, generamos traducción técnica para el "Dual-Index"
                let translatedText: string | undefined = undefined;

                // Estrategia Dual-Indexing (Shadow Chunks):
                // Si el documento es extranjero (ej: DE), generamos un chunk "sombra" en ES.
                // Ambos chunks (Original DE + Sombra ES) se indexan vectorialmente.
                // Esto permite encontrar el documento buscando tanto en Alemán como en Español.

                if (detectedLang !== 'es') {
                    try {
                        const { text: translationPrompt, model: transModel } = await PromptService.getRenderedPrompt(
                            'TECHNICAL_TRANSLATOR',
                            { text: chunkText, targetLanguage: 'Spanish' },
                            tenantId
                        );
                        translatedText = await callGeminiMini(translationPrompt, tenantId, { correlacion_id, model: transModel });
                    } catch (e) {
                        console.warn(`[INGEST] Fallo traducción de chunk: ${e}`);
                    }
                }

                // Generar embeddings (Gemini + BGE-M3)
                const startEmbed = Date.now();

                // 1. Embedding del Original
                const [embeddingGemini, embeddingBGE] = await Promise.all([
                    generateEmbedding(chunkText, tenantId, correlacion_id),
                    multilingualService.generateEmbedding(chunkText)
                ]);

                // 2. Embedding del Shadow (si existe traducción)
                let embeddingShadow: number[] | undefined;
                if (translatedText) {
                    embeddingShadow = await generateEmbedding(translatedText, tenantId, correlacion_id);
                }

                const durationEmbed = Date.now() - startEmbed;

                if (durationEmbed > 5000) {
                    console.log(`⚠️  [INGEST] Chunk embed took ${durationEmbed}ms`);
                }

                // Tracking de uso (Embeddings)
                await UsageService.trackEmbedding(tenantId, 1, 'text-embedding-004', correlacion_id); // Original
                if (translatedText) {
                    await UsageService.trackEmbedding(tenantId, 1, 'text-embedding-004-shadow', correlacion_id); // Shadow
                }
                if (embeddingBGE.length > 0) {
                    await UsageService.trackEmbedding(tenantId, 1, 'bge-m3-local', correlacion_id);
                }

                // --- Insertar Chunk Original ---
                const originalChunkId = new ObjectId();
                const documentChunk = {
                    _id: originalChunkId,
                    tenantId,
                    industry: "ELEVATORS",
                    tipo_componente: metadata.tipo,
                    modelo: modeloPrincipal,
                    origen_doc: file.name,
                    version_doc: metadata.version,
                    fecha_revision: new Date(),
                    language: detectedLang,
                    texto_chunk: chunkText,
                    texto_traducido: translatedText, // Guardamos texto por referencia
                    embedding: embeddingGemini,
                    embedding_multilingual: embeddingBGE,
                    is_shadow: false,
                    cloudinary_url: cloudinaryResult.secureUrl,
                    cloudinary_public_id: cloudinaryResult.publicId,
                    creado: new Date(),
                };

                const validatedChunk = DocumentChunkSchema.parse(documentChunk);
                await documentChunksCollection.insertOne(validatedChunk);

                // --- Insertar Shadow Chunk (si aplica) ---
                if (translatedText && embeddingShadow) {
                    const shadowChunk = {
                        tenantId,
                        industry: "ELEVATORS",
                        tipo_componente: metadata.tipo,
                        modelo: modeloPrincipal,
                        origen_doc: file.name,
                        version_doc: metadata.version,
                        fecha_revision: new Date(),
                        language: 'es', // El shadow simula ser español
                        original_lang: detectedLang, // Referencia al idioma real
                        texto_chunk: translatedText, // El contenido principal ES EL TRADUCIDO para búsqueda
                        ref_chunk_id: originalChunkId, // Link al padre
                        embedding: embeddingShadow, // Vector del texto traducido
                        is_shadow: true,
                        cloudinary_url: cloudinaryResult.secureUrl, // Apunta al mismo PDF visual
                        cloudinary_public_id: cloudinaryResult.publicId,
                        creado: new Date(),
                    };

                    // Nota: No validamos con Zod estricto aquí para permitir flexibilidad en ref_chunk_id, 
                    // o usamos el mismo schema si ref_chunk_id es soportado.
                    // Como acabamos de añadir ref_chunk_id a Zod, podemos validar.
                    const validatedShadow = DocumentChunkSchema.parse(shadowChunk);
                    await documentChunksCollection.insertOne(validatedShadow);
                }
            }));

            await logEvento({
                nivel: 'INFO',
                origen: 'API_INGEST',
                accion: 'BATCH_PROCESSED',
                mensaje: `Procesado batch ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(chunks.length / BATCH_SIZE)}`,
                correlacion_id,
                detalles: { batchIndex: i / BATCH_SIZE, totalChunks: chunks.length }
            });
        }

        return NextResponse.json({
            success: true,
            correlacion_id,
            message: `Documento procesado correctamente con Dual-Indexing (${chunks.length} fragmentos)`,
            chunks: chunks.length,
            idioma: detectedLang
        });

        // AUTO-AUDIT: Registro de éxito
        const auditEntry = {
            tenantId,
            performedBy: userEmail,
            ip,
            userAgent,
            filename: file.name,
            fileSize: file.size,
            md5: fileHash,
            docId: validatedDocumentoMetadata._id, // Available after insert
            correlacion_id,
            status: 'SUCCESS' as const,
            details: {
                chunks: chunks.length,
                duration_ms: Date.now() - inicio,
            }
        };
        // Reuse DB connection if possible, strictly we need to ensure DocumentoTecnicoSchema returns _id or we read it
        // The insertOne mutates the object adding _id if not present, or returns insertedId.
        // But validatedDocumentoMetadata is a Zod parsed object, insertOne returns result.
        // Let's capture the ID properly above.

        // Fix: Insert logic above doesn't capture ID easily in variable unless we change how we call insertOne
        await db.collection('audit_ingestion').insertOne(AuditIngestSchema.parse(auditEntry));

    } catch (error: any) {
        // Log para depuración server-side
        console.error(`[INGEST ERROR] Correlation: ${correlacion_id}`, error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Metadatos de ingesta inválidos', error.errors).toJSON(),
                { status: 400 }
            );
        }

        // Check robusto por si instanceof falla en compilación/bundling
        if (error instanceof AppError || error?.name === 'AppError') {
            const appError = error instanceof AppError ? error : new AppError(error.code, error.status, error.message, error.details);
            return NextResponse.json(appError.toJSON(), { status: appError.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_INGEST',
            accion: 'ERROR_FATAL',
            mensaje: error.message || 'Error desconocido',
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Error crítico en ingesta',
                    details: error.message
                }
            },
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
