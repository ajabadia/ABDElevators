
import { connectDB } from '@/lib/db';
import { DocumentChunkSchema, IngestAuditSchema, KnowledgeAssetSchema } from '@/lib/schemas';
import { AppError, DatabaseError, ValidationError, ExternalServiceError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { extractModelsWithGemini, callGeminiMini, analyzePDFVisuals, generateEmbedding } from '@/lib/llm';
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
     * Phase 1: Preparation (Síncrono)
     * Realiza validaciones rápidas, de-duplicación y subida inicial.
     * Registra el activo con estado 'PENDING'.
     */
    static async prepareIngest(options: IngestOptions): Promise<{ docId: string; status: string; correlationId: string; isDuplicate?: boolean }> {
        const { file, metadata, tenantId, environment = 'PRODUCTION' } = options;
        const correlationId = options.correlationId || crypto.randomUUID();
        const start = Date.now();

        // 1. Critical Size Validation
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        // @ts-ignore
        const fileSize = file.size || 0;
        if (fileSize > MAX_FILE_SIZE) {
            throw new ValidationError(`File too large. Max size is 50MB. Received: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

        const db = await connectDB();
        const knowledgeAssetsCollection = db.collection('knowledge_assets');

        // Deduplicación
        const existingDoc = await knowledgeAssetsCollection.findOne({
            fileMd5: fileHash,
            tenantId,
            environment
        });

        if (existingDoc) {
            return {
                docId: existingDoc._id.toString(),
                status: 'DUPLICATE',
                correlationId,
                isDuplicate: true
            };
        }

        // 2. Upload PDF a Cloudinary (Necesario antes de encolar si queremos persistencia del binario)
        const cloudinaryResult = await withRetry(
            () => uploadRAGDocument(buffer, file.name, tenantId),
            { maxRetries: 3, initialDelayMs: 1000 }
        );

        // 3. Crear Registro Inicial en 'knowledge_assets'
        const docMetadata = {
            tenantId,
            filename: file.name,
            componentType: metadata.type,
            model: 'PENDING',
            version: metadata.version,
            revisionDate: new Date(),
            status: 'vigente' as const,
            ingestionStatus: 'PENDING' as const,
            cloudinaryUrl: cloudinaryResult.secureUrl,
            cloudinaryPublicId: cloudinaryResult.publicId,
            fileMd5: fileHash,
            totalChunks: 0,
            environment,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const validatedDoc = KnowledgeAssetSchema.parse(docMetadata);

        try {
            const result = await knowledgeAssetsCollection.insertOne(validatedDoc);
            return {
                docId: result.insertedId.toString(),
                status: 'PENDING',
                correlationId
            };
        } catch (error: any) {
            // Manejo de condición de carrera: Si el índice único salta justo ahora
            if (error.code === 11000 || error.message?.includes('E11000')) {
                const existing = await knowledgeAssetsCollection.findOne({
                    fileMd5: fileHash,
                    tenantId,
                    environment
                });
                return {
                    docId: existing?._id.toString() || 'unknown',
                    status: 'DUPLICATE',
                    correlationId,
                    isDuplicate: true
                };
            }
            throw error;
        }
    }

    /**
     * Phase 2: Heavy Analysis (Asíncrono)
     * Realiza el análisis multimodal, PII, embeddings y guardado de chunks.
     * Diseñado para ser ejecutado por un worker de BullMQ.
     */
    static async executeAnalysis(docId: string, options: Partial<IngestOptions> & { job?: any }): Promise<IngestResult> {
        const correlationId = options.correlationId || crypto.randomUUID();
        const start = Date.now();
        const job = options.job;

        const db = await connectDB();
        const knowledgeAssetsCollection = db.collection('knowledge_assets');
        const documentChunksCollection = db.collection('document_chunks');

        const assetId = new ObjectId(docId);
        const asset = await knowledgeAssetsCollection.findOne({ _id: assetId });

        if (!asset) {
            throw new AppError('NOT_FOUND', 404, `Knowledge asset ${docId} not found`);
        }

        const currentAttempts = (asset.attempts || 0) + 1;
        const industry = asset.industry || 'ELEVATORS'; // Baseline vertical

        await knowledgeAssetsCollection.updateOne(
            { _id: assetId },
            {
                $set: {
                    ingestionStatus: 'PROCESSING',
                    attempts: currentAttempts,
                    updatedAt: new Date()
                }
            }
        );

        const updateProgress = async (percent: number) => {
            if (job) await job.updateProgress(percent);
            await knowledgeAssetsCollection.updateOne(
                { _id: assetId },
                { $set: { progress: percent, updatedAt: new Date() } }
            );
        };

        try {
            await updateProgress(5); // Start processing

            // Descargar el binario de Cloudinary
            const response = await fetch(asset.cloudinaryUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await updateProgress(15); // Downloaded

            // 1. Extract Text & Visuals
            const [rawText, visualFindings] = await Promise.all([
                extractTextAdvanced(buffer),
                analyzePDFVisuals(buffer, asset.tenantId, correlationId)
            ]);

            await updateProgress(40); // Analysis complete

            // 1.5 Domain Routing (Phase 101)
            let detectedIndustry = industry;
            if (industry === 'GENERIC' || industry === 'ELEVATORS') {
                const { DomainRouterService } = await import('@/services/domain-router-service');
                detectedIndustry = await DomainRouterService.detectIndustry(rawText, asset.tenantId, correlationId);

                await knowledgeAssetsCollection.updateOne(
                    { _id: assetId },
                    { $set: { industry: detectedIndustry, updatedAt: new Date() } }
                );
            }

            // 2. PII Masking
            let text = rawText;
            const maskPii = options.maskPii !== false;
            if (maskPii) {
                const { PIIMasker } = await import('@/lib/pii-masker');
                const { maskedText } = PIIMasker.mask(rawText, asset.tenantId, correlationId);
                text = maskedText;
            }

            await updateProgress(50); // PII complete

            // 3. Language & Models
            const { text: languagePrompt, model: langModel } = await PromptService.getRenderedPrompt(
                'LANGUAGE_DETECTOR',
                { text: text.substring(0, 2000) },
                asset.tenantId
            );
            const detectedLang = (await callGeminiMini(languagePrompt, asset.tenantId, { correlationId, model: langModel })).trim().toLowerCase().substring(0, 2);
            const detectedModels = await extractModelsWithGemini(text, asset.tenantId, correlationId);
            const primaryModel = detectedModels.length > 0 ? detectedModels[0].model : 'UNKNOWN';

            await updateProgress(60); // Metadata complete

            // 3.5 Cognitive Context Generation (Phase 102)
            const { CognitiveRetrievalService } = await import('@/services/cognitive-retrieval-service');
            const documentContext = await CognitiveRetrievalService.generateDocumentContext(
                text,
                detectedIndustry,
                asset.tenantId,
                correlationId
            );

            // 4. Chunking
            const textChunks = await chunkText(text);

            // 5. Graph Extraction (Phase 61)
            const { GraphExtractionService } = await import('@/services/graph-extraction-service');
            await GraphExtractionService.extractAndPersist(
                text,
                asset.tenantId,
                correlationId,
                { sourceDoc: asset.filename }
            ).catch(e => console.error("[GRAPH EXTRACTION ERROR]", e));

            await updateProgress(70); // Chunks generated

            // 6. Process Chunks (Parallel Batches)
            const allChunksToProcess = [
                ...textChunks.map(tc => ({ type: 'TEXT' as const, text: tc, page: undefined })),
                ...visualFindings.map(vf => ({
                    type: 'VISUAL' as const,
                    text: vf.technical_description,
                    page: vf.page
                }))
            ];

            const { multilingualService } = await import('@/lib/multilingual-service');
            const BATCH_SIZE = 10;
            let successCount = 0;

            const totalChunks = allChunksToProcess.length;
            for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
                const batch = allChunksToProcess.slice(i, i + BATCH_SIZE);
                const results = await Promise.allSettled(batch.map(async (chunkData) => {
                    const [embeddingGemini, embeddingBGE] = await Promise.all([
                        generateEmbedding(chunkData.text, asset.tenantId, correlationId),
                        multilingualService.generateEmbedding(chunkData.text)
                    ]);

                    const chunkId = new ObjectId();
                    const documentChunk = DocumentChunkSchema.parse({
                        _id: chunkId,
                        tenantId: asset.tenantId,
                        industry: detectedIndustry,
                        componentType: asset.componentType,
                        model: primaryModel,
                        sourceDoc: asset.filename,
                        version: asset.version,
                        revisionDate: asset.revisionDate,
                        language: chunkData.type === 'VISUAL' ? 'es' : detectedLang,
                        chunkType: chunkData.type,
                        chunkText: `[CONTEXTO: ${documentContext}]\n\n${chunkData.text}`,
                        originalSnippet: chunkData.text,
                        contextHeader: documentContext,
                        approxPage: chunkData.page,
                        embedding: embeddingGemini,
                        embedding_multilingual: embeddingBGE,
                        cloudinaryUrl: asset.cloudinaryUrl,
                        environment: asset.environment,
                        createdAt: new Date(),
                    });

                    await documentChunksCollection.insertOne(documentChunk);
                    return true;
                }));

                successCount += results.filter(r => r.status === 'fulfilled').length;

                // Progress within chunk processing (70-95%)
                const chunkPercent = Math.min(95, 70 + Math.floor((i + batch.length) / totalChunks * 25));
                await updateProgress(chunkPercent);
            }

            // 7. Final Update
            await knowledgeAssetsCollection.updateOne(
                { _id: assetId },
                {
                    $set: {
                        ingestionStatus: 'COMPLETED',
                        progress: 100,
                        model: primaryModel,
                        language: detectedLang,
                        totalChunks: successCount,
                        updatedAt: new Date()
                    }
                }
            );

            // Audit
            await db.collection('audit_ingestion').insertOne(IngestAuditSchema.parse({
                tenantId: asset.tenantId,
                performedBy: options.userEmail || 'system_worker',
                filename: asset.filename,
                fileSize: 0,
                md5: asset.fileMd5 || 'unknown',
                docId: assetId,
                correlationId,
                status: 'SUCCESS',
                details: { chunks: successCount, duration_ms: Date.now() - start, attempts: currentAttempts }
            }));

            return {
                success: true,
                correlationId,
                message: "Processed successfully",
                chunks: successCount
            };

        } catch (error: any) {
            console.error(`[ASYNC INGEST ERROR] ${docId} (Attempt ${currentAttempts})`, error);
            await knowledgeAssetsCollection.updateOne(
                { _id: assetId },
                { $set: { ingestionStatus: 'FAILED', error: error.message, updatedAt: new Date() } }
            );
            throw error;
        }
    }

    /**
     * Legacy/Synchronous Wrapper (for backward compatibility if needed)
     */
    static async processDocument(options: IngestOptions): Promise<IngestResult> {
        const prep = await this.prepareIngest(options);
        if (prep.status === 'DUPLICATE') {
            return {
                success: true,
                correlationId: prep.correlationId,
                message: "Document already indexed.",
                chunks: 0,
                isDuplicate: true
            };
        }
        return this.executeAnalysis(prep.docId, options);
    }
}
