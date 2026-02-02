
import { connectDB } from '@/lib/db';
import { DocumentChunkSchema, IngestAuditSchema, KnowledgeAssetSchema } from '@/lib/schemas';
import { AppError, DatabaseError, ValidationError, ExternalServiceError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { generateEmbedding, extractModelsWithGemini, callGeminiMini, analyzePDFVisuals } from '@/lib/llm';
import { extractTextAdvanced } from '@/lib/pdf-utils';
import { chunkText } from '@/lib/chunk-utils';
import { uploadRAGDocument } from '@/lib/cloudinary';
import { PromptService } from '@/lib/prompt-service';
import { UsageService } from '@/lib/usage-service';
import { withRetry } from '@/lib/retry';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';

export interface IngestOptions {
    file: File | { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
    metadata: {
        type: string;
        version: string;
    };
    tenantId: string;
    userEmail: string;
    environment?: string;
    ip?: string;
    userAgent?: string;
    correlationId?: string;
    maskPii?: boolean;
}

export interface IngestResult {
    success: boolean;
    correlationId: string;
    message: string;
    chunks: number;
    isDuplicate?: boolean;
    isCloned?: boolean;
    savings?: number;
    language?: string;
}

export class IngestService {
    /**
     * Processes a document (PDF) for RAG ingestion: deduplication, upload, extraction, chunking, embedding, and indexing.
     */
    static async processDocument(options: IngestOptions): Promise<IngestResult> {
        const { file, metadata, tenantId, userEmail, environment = 'PRODUCTION', ip = '0.0.0.0', userAgent = 'System' } = options;
        const correlationId = options.correlationId || crypto.randomUUID();
        const start = Date.now();

        // 1. Critical Size Validation (Prevent OOM)
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        // @ts-ignore - file.size might be missing in some mock inputs, but File always has it
        const fileSize = file.size || 0;
        if (fileSize > MAX_FILE_SIZE) {
            throw new ValidationError(`File too large. Max size is 50MB. Received: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
        }

        await logEvento({
            level: 'INFO',
            source: 'INGEST_SERVICE',
            action: 'START',
            message: `Starting ingest for ${file.name}`,
            correlationId,
            details: { filename: file.name, size: fileSize }
        });

        // We still need the buffer for Text Extraction and hash calculation (until pdf-utils supports streams)
        // Since we validated size <= 50MB, this Buffer.from is safe(r).
        const buffer = Buffer.from(await file.arrayBuffer());

        // 0. Deduplication by MD5
        const fileHash = crypto.createHash('md5').update(buffer).digest('hex');
        const db = await connectDB();
        const documentChunksCollection = db.collection('document_chunks');
        const knowledgeAssetsCollection = db.collection('knowledge_assets');

        const existingDoc = await knowledgeAssetsCollection.findOne({ fileMd5: fileHash });

        if (existingDoc) {
            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'DEDUPLICATION',
                message: `Identical document detected (MD5: ${fileHash}).`,
                correlationId,
                details: { originalDocId: existingDoc._id, filename: file.name }
            });

            // If it already exists for this tenant
            const currentTenantDoc = await knowledgeAssetsCollection.findOne({
                fileMd5: fileHash,
                tenantId
            });

            if (currentTenantDoc) {
                return {
                    success: true,
                    correlationId,
                    message: "Document already indexed for this tenant.",
                    chunks: currentTenantDoc.totalChunks,
                    isDuplicate: true
                };
            }

            // If exists in another tenant, clone valid metadata
            const newDocMetadata = {
                tenantId,
                filename: file.name,
                componentType: metadata.type,
                model: existingDoc.model,
                version: metadata.version,
                revisionDate: new Date(),
                language: existingDoc.language || 'es',
                status: 'vigente' as const,
                cloudinaryUrl: existingDoc.cloudinaryUrl,
                cloudinaryPublicId: existingDoc.cloudinaryPublicId,
                fileMd5: fileHash,
                totalChunks: existingDoc.totalChunks,
                environment,
                createdAt: new Date(),
            };

            const validatedNewDoc = KnowledgeAssetSchema.parse(newDocMetadata);
            await knowledgeAssetsCollection.insertOne(validatedNewDoc);

            // Clone chunks (AI Token Savings)
            const originalChunks = await documentChunksCollection.find({
                cloudinary_public_id: existingDoc.cloudinaryPublicId
            }).toArray();

            if (originalChunks.length > 0) {
                const newChunks = originalChunks.map(chunk => ({
                    ...chunk,
                    _id: undefined,
                    tenantId,
                    sourceDoc: file.name,
                    version: metadata.version,
                    environment,
                    createdAt: new Date()
                }));
                // Remove _id for bulk insert
                newChunks.forEach(c => delete (c as any)._id);
                await documentChunksCollection.insertMany(newChunks);
            }

            // SAVINGS TRACKING
            const estimatedSavedTokens = (originalChunks.length * 150) + 1000;
            await UsageService.trackDeduplicationSaving(tenantId, estimatedSavedTokens, correlationId);

            // AUTO-AUDIT: Duplicate Record
            const auditEntry = {
                tenantId,
                performedBy: userEmail,
                ip,
                userAgent,
                filename: file.name,
                fileSize: fileSize,
                md5: fileHash,
                docId: validatedNewDoc._id ?? undefined,
                correlationId,
                status: 'DUPLICATE' as const,
                details: {
                    chunks: originalChunks.length,
                    duration_ms: Date.now() - start,
                    savings_tokens: estimatedSavedTokens
                }
            };
            await db.collection('audit_ingestion').insertOne(IngestAuditSchema.parse(auditEntry));

            return {
                success: true,
                correlationId,
                message: `Document reused by content match (${originalChunks.length} chunks). Estimated savings: ${estimatedSavedTokens} tokens.`,
                chunks: originalChunks.length,
                isCloned: true,
                savings: estimatedSavedTokens
            };
        }

        // Full Processing
        await logEvento({ level: 'DEBUG', source: 'INGEST_SERVICE', action: 'PROCESS', message: `New file (MD5: ${fileHash}). Starting full processing.`, correlationId });

        // 1. Upload PDF
        // Note: Ideally use file.stream() here if we didn't need the buffer for extraction/hash. 
        // We pass the buffer since we already paid the memory cost.
        const cloudinaryResult = await withRetry(
            () => uploadRAGDocument(buffer, file.name, tenantId),
            { maxRetries: 3, initialDelayMs: 1000 }
        );

        // 2. Extract Text & Visuals in PARALLEL (Phase 52)
        const [rawText, visualFindings] = await Promise.all([
            extractTextAdvanced(buffer),
            analyzePDFVisuals(buffer, tenantId, correlationId)
        ]);

        // 2.1 PII Masking (Phase 61)
        let text = rawText;
        const maskPii = options.maskPii !== false; // Default to true

        if (maskPii) {
            const { PIIMasker } = await import('@/lib/pii-masker');
            const { maskedText, metadata: piiMetadata } = PIIMasker.mask(rawText, tenantId, correlationId);
            text = maskedText;

            if (piiMetadata.count > 0) {
                await logEvento({
                    level: 'INFO',
                    source: 'INGEST_SERVICE',
                    action: 'PII_DETECTION',
                    message: `De-identified ${piiMetadata.count} PII items in ${file.name}`,
                    correlationId,
                    details: { piiCount: piiMetadata.count, piiTypes: piiMetadata.types }
                });
            }
        } else {
            await logEvento({
                level: 'WARN',
                source: 'INGEST_SERVICE',
                action: 'PII_MASKING_DISABLED',
                message: `PII Masking explicitly disabled for document: ${file.name}. Sensitive data may be stored.`,
                correlationId
            });
        }

        // 2.1. Detect Language
        const { text: languagePrompt, model: langModel } = await PromptService.getRenderedPrompt(
            'LANGUAGE_DETECTOR',
            { text: text.substring(0, 2000) },
            tenantId
        );
        const detectedLang = (await callGeminiMini(languagePrompt, tenantId, { correlationId, model: langModel })).trim().toLowerCase().substring(0, 2);

        // 3. AI: Extract Models
        const detectedModels = await extractModelsWithGemini(text, tenantId, correlationId);
        const primaryModel = detectedModels.length > 0 ? detectedModels[0].model : 'UNKNOWN';

        // 4. Chunking (Text + Visual)
        const textChunks = await chunkText(text);

        // 5.1. Save Document Metadata
        const totalChunks = textChunks.length + visualFindings.length;
        const documentMetadata = {
            tenantId,
            filename: file.name,
            componentType: metadata.type,
            model: primaryModel,
            version: metadata.version,
            revisionDate: new Date(),
            language: detectedLang,
            status: 'vigente' as const,
            cloudinaryUrl: cloudinaryResult.secureUrl,
            cloudinaryPublicId: cloudinaryResult.publicId,
            fileMd5: fileHash,
            totalChunks: totalChunks,
            environment,
            createdAt: new Date(),
        };

        const validatedDocumentMetadata = KnowledgeAssetSchema.parse(documentMetadata);
        const insertResult = await knowledgeAssetsCollection.insertOne(validatedDocumentMetadata);
        const docId = insertResult.insertedId;

        // 5.1.5. Graph Extraction (Phase 61)
        const { GraphExtractionService } = await import('@/services/graph-extraction-service');
        await GraphExtractionService.extractAndPersist(
            text,
            tenantId,
            correlationId,
            { sourceDoc: file.name }
        ).catch(e => console.error("[GRAPH EXTRACTION ERROR]", e));

        // 5.2. Process ALL Chunks (Text + Visual)
        const { multilingualService } = await import('@/lib/multilingual-service');
        const BATCH_SIZE = 10;
        let successCount = 0;
        let failCount = 0;

        // Combinar chunks de texto y hallazgos visuales para procesamiento uniforme
        const allChunksToProcess = [
            ...textChunks.map(tc => ({ type: 'TEXT' as const, text: tc, page: undefined })),
            ...visualFindings.map(vf => ({
                type: 'VISUAL' as const,
                text: vf.technical_description,
                page: vf.page
            }))
        ];

        for (let i = 0; i < allChunksToProcess.length; i += BATCH_SIZE) {
            // CIRCUIT BREAKER Check
            if (allChunksToProcess.length > 20 && (failCount / allChunksToProcess.length) > 0.2) {
                await logEvento({
                    level: 'ERROR',
                    source: 'INGEST_SERVICE',
                    action: 'CIRCUIT_BREAKER_TRIP',
                    message: `Aborting ingestion. Error rate exceeded 20% (${failCount} failures).`,
                    correlationId
                });
                throw new ExternalServiceError('Ingestion aborted due to high error rate (External API instability)');
            }

            const batch = allChunksToProcess.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (chunkData) => {
                let translatedText: string | undefined = undefined;
                const chunkText = chunkData.text;

                // Solo traducir si es texto y no es español
                if (chunkData.type === 'TEXT' && detectedLang !== 'es') {
                    try {
                        const { text: translationPrompt, model: transModel } = await PromptService.getRenderedPrompt(
                            'TECHNICAL_TRANSLATOR',
                            { text: chunkText, targetLanguage: 'Spanish' },
                            tenantId
                        );
                        translatedText = await callGeminiMini(translationPrompt, tenantId, { correlationId, model: transModel });
                    } catch (e) {
                        // Silent fail on translation is acceptable for now
                    }
                }

                // Generate Embeddings
                const [embeddingGemini, embeddingBGE] = await Promise.all([
                    generateEmbedding(chunkText, tenantId, correlationId),
                    multilingualService.generateEmbedding(chunkText)
                ]);

                let embeddingShadow: number[] | undefined;
                if (translatedText) {
                    embeddingShadow = await generateEmbedding(translatedText, tenantId, correlationId);
                }

                return { ...chunkData, translatedText, embeddingGemini, embeddingBGE, embeddingShadow };
            });

            // Use Promise.allSettled for Resilience
            const results = await Promise.allSettled(batchPromises);

            // Process results
            const dbOps = results.map(async (res) => {
                if (res.status === 'rejected') {
                    failCount++;
                    console.error(`[INGEST BATCH ERROR] Chunk processing failed:`, res.reason);
                    return; // Skip this chunk
                }

                const data = res.value;
                successCount++;

                // Usage Tracking (Approximation)
                await UsageService.trackEmbedding(tenantId, 1, 'text-embedding-004', correlationId);
                if (data.translatedText) await UsageService.trackEmbedding(tenantId, 1, 'text-embedding-004-shadow', correlationId);
                if (data.embeddingBGE.length > 0) await UsageService.trackEmbedding(tenantId, 1, 'bge-m3-local', correlationId);

                // Insert Original Chunk
                const originalChunkId = new ObjectId();
                const documentChunk = {
                    _id: originalChunkId,
                    tenantId,
                    industry: "ELEVATORS" as const,
                    componentType: metadata.type,
                    model: primaryModel,
                    sourceDoc: file.name,
                    version: metadata.version,
                    revisionDate: new Date(),
                    language: data.type === 'VISUAL' ? 'es' : detectedLang, // Visuals are generated in Spanish usually
                    chunkType: data.type,
                    chunkText: data.text,
                    visualDescription: data.type === 'VISUAL' ? data.text : undefined,
                    approxPage: data.page,
                    translatedText: data.translatedText,
                    embedding: data.embeddingGemini,
                    embedding_multilingual: data.embeddingBGE,
                    cloudinaryUrl: cloudinaryResult.secureUrl,
                    isShadow: false,
                    environment,
                    createdAt: new Date(),
                };
                await documentChunksCollection.insertOne(DocumentChunkSchema.parse(documentChunk));

                // Insert Shadow Chunk (Sólo para TEXT)
                if (data.type === 'TEXT' && data.translatedText && data.embeddingShadow) {
                    const shadowChunk = {
                        tenantId,
                        industry: "ELEVATORS" as const,
                        componentType: metadata.type,
                        model: primaryModel,
                        sourceDoc: file.name,
                        version: metadata.version,
                        revisionDate: new Date(),
                        language: 'es',
                        originalLang: detectedLang,
                        chunkText: data.translatedText,
                        chunkType: 'TEXT' as const,
                        refChunkId: originalChunkId,
                        embedding: data.embeddingShadow,
                        cloudinaryUrl: cloudinaryResult.secureUrl,
                        isShadow: true,
                        environment,
                        createdAt: new Date(),
                    };
                    await documentChunksCollection.insertOne(DocumentChunkSchema.parse(shadowChunk));
                }
            });

            await Promise.all(dbOps);
        }

        // AUTO-AUDIT: Success or Partial Success
        const finalStatus = failCount === 0 ? 'SUCCESS' : (successCount > 0 ? 'PARTIAL_SUCCESS' : 'FAILED');

        const auditEntry = {
            tenantId,
            performedBy: userEmail,
            ip,
            userAgent,
            filename: file.name,
            fileSize: fileSize,
            md5: fileHash,
            docId: docId,
            correlationId,
            status: finalStatus as any, // Cast for enum mismatch potential
            details: {
                chunks_total: allChunksToProcess.length,
                chunks_success: successCount,
                chunks_failed: failCount,
                duration_ms: Date.now() - start,
            }
        };
        await db.collection('audit_ingestion').insertOne(IngestAuditSchema.parse(auditEntry));

        return {
            success: successCount > 0,
            correlationId,
            message: `Document processed. Success: ${successCount}. Failed: ${failCount}.`,
            chunks: successCount,
            language: detectedLang
        };
    }
}
