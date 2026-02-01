import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { DocumentChunkSchema, KnowledgeAssetSchema, IngestAuditSchema } from '@/lib/schemas';
import { ValidationError, AppError, DatabaseError } from '@/lib/errors';
import { generateEmbedding, extractModelsWithGemini, callGeminiMini } from '@/lib/llm';
import { extractTextAdvanced, extractTextFromPDF } from '@/lib/pdf-utils';
import { chunkText } from '@/lib/chunk-utils';
import { uploadRAGDocument } from '@/lib/cloudinary';
import { z } from 'zod';
import { PromptService } from '@/lib/prompt-service';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { UsageService } from '@/lib/usage-service';
import { withRetry } from '@/lib/retry';

// Schema for upload metadata
const IngestMetadataSchema = z.object({
    type: z.string().min(1),
    version: z.string().min(1),
});

/**
 * POST /api/admin/ingest
 * Processes a PDF file, splits it into chunks, and generates embeddings.
 * SLA: P95 < 20000ms (due to extraction, embeddings, and massive insertion)
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();

    try {
        // Rule #9: Security Check
        const session = await auth();
        if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('UNAUTHORIZED', 401, 'Unauthorized');
        }

        // Rule #9: Headers for Audit
        const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const userEmail = session.user?.email || 'unknown';

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const metadataRaw = {
            type: formData.get('type') || formData.get('tipo'),
            version: formData.get('version'),
        };

        // Rule #2: Zod First
        if (!file) {
            throw new ValidationError('No file provided');
        }
        const metadata = IngestMetadataSchema.parse(metadataRaw);

        await logEvento({
            level: 'INFO',
            source: 'API_INGEST',
            action: 'START',
            message: `Starting ingest for ${file.name}`,
            correlationId,
            details: { filename: file.name, size: file.size }
        });

        const buffer = Buffer.from(await file.arrayBuffer());
        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID not found in session');
        }

        // 0. Deduplication by MD5 (Token Saving)
        const fileHash = crypto.createHash('md5').update(buffer).digest('hex');
        const db = await connectDB();
        const documentChunksCollection = db.collection('document_chunks');
        const knowledgeAssetsCollection = db.collection('knowledge_assets');

        const existingDoc = await knowledgeAssetsCollection.findOne({ fileMd5: fileHash });

        if (existingDoc) {
            await logEvento({
                level: 'INFO',
                source: 'API_INGEST',
                action: 'DEDUPLICATION',
                message: `Identical document detected (MD5: ${fileHash}). Cloning metadata for tenant ${tenantId}.`,
                correlationId,
                details: { originalDocId: existingDoc._id, filename: file.name }
            });

            // If it already exists for this tenant, return success or update date
            const currentTenantDoc = await knowledgeAssetsCollection.findOne({
                fileMd5: fileHash,
                tenantId
            });

            if (currentTenantDoc) {
                return NextResponse.json({
                    success: true,
                    correlationId,
                    message: "Document already indexed for this tenant.",
                    chunks: currentTenantDoc.totalChunks,
                    isDuplicate: true
                });
            }

            // If exists in another tenant, clone valid metadata (metadata entry)
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
                createdAt: new Date(),
            };

            const validatedNewDoc = KnowledgeAssetSchema.parse(newDocMetadata);
            await knowledgeAssetsCollection.insertOne(validatedNewDoc);

            // Clone chunks (Sacred Isolation but AI Token Savings)
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
                    createdAt: new Date()
                }));
                // Remove _id for bulk insert
                newChunks.forEach(c => delete (c as any)._id);

                await documentChunksCollection.insertMany(newChunks);
            }

            // --- SAVINGS TRACKING (Vision 2.0) ---
            const estimatedSavedTokens = (originalChunks.length * 150) + 1000;
            await UsageService.trackDeduplicationSaving(tenantId, estimatedSavedTokens, correlationId);

            // AUTO-AUDIT: Duplicate Record
            const auditEntry = {
                tenantId,
                performedBy: userEmail,
                ip,
                userAgent,
                filename: file.name,
                fileSize: file.size,
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

            return NextResponse.json({
                success: true,
                correlationId,
                message: `Document reused by content match (${originalChunks.length} chunks). Estimated savings: ${estimatedSavedTokens} tokens.`,
                chunks: originalChunks.length,
                isCloned: true,
                savings: estimatedSavedTokens
            });
        }

        await logEvento({ level: 'DEBUG', source: 'API_INGEST', action: 'PROCESS', message: `New file (MD5: ${fileHash}). Starting full processing.`, correlationId });

        // 1. Upload PDF to Cloudinary (Tenant Isolation)
        // Resilience: Retry on upload failure
        const cloudinaryResult = await withRetry(
            () => uploadRAGDocument(buffer, file.name, tenantId),
            { maxRetries: 3, initialDelayMs: 1000 }
        );
        await logEvento({ level: 'DEBUG', source: 'API_INGEST', action: 'PROCESS', message: 'Uploaded to Cloudinary', correlationId });

        // 2. Extract Text (Advanced Hybrid Strategy - Phase 27)
        const text = await extractTextAdvanced(buffer);
        await logEvento({ level: 'DEBUG', source: 'API_INGEST', action: 'PROCESS', message: `Text extracted (PyMuPDF): ${text.length} chars`, correlationId });

        // 2.1. Detect Language (Phase 21.1)
        const { text: languagePrompt, model: langModel } = await PromptService.getRenderedPrompt(
            'LANGUAGE_DETECTOR',
            { text: text.substring(0, 2000) },
            tenantId
        );
        const detectedLang = (await callGeminiMini(languagePrompt, tenantId, { correlationId, model: langModel })).trim().toLowerCase().substring(0, 2);

        // 3. AI: Extract Models
        const detectedModels = await extractModelsWithGemini(text, tenantId, correlationId);
        const primaryModel = detectedModels.length > 0 ? detectedModels[0].model : 'UNKNOWN';

        // 4. Chunking
        const chunks = await chunkText(text);

        // 5.1. Save Document Metadata
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
            totalChunks: chunks.length,
            createdAt: new Date(),
        };

        const validatedDocumentMetadata = KnowledgeAssetSchema.parse(documentMetadata);
        const insertResult = await knowledgeAssetsCollection.insertOne(validatedDocumentMetadata);
        const docId = insertResult.insertedId;

        // 5.2. Process Chunks with Dual-Indexing
        const { multilingualService } = await import('@/lib/multilingual-service');
        const BATCH_SIZE = 10;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (chunkText) => {
                let translatedText: string | undefined = undefined;

                // Dual-Indexing Strategy (Shadow Chunks)
                if (detectedLang !== 'es') {
                    try {
                        const { text: translationPrompt, model: transModel } = await PromptService.getRenderedPrompt(
                            'TECHNICAL_TRANSLATOR',
                            { text: chunkText, targetLanguage: 'Spanish' },
                            tenantId
                        );
                        translatedText = await callGeminiMini(translationPrompt, tenantId, { correlationId, model: transModel });
                    } catch (e) {
                        console.warn(`[INGEST] Chunk translation failed: ${e}`);
                    }
                }

                // Generate Embeddings
                const startEmbed = Date.now();

                // 1. Original Embedding
                const [embeddingGemini, embeddingBGE] = await Promise.all([
                    generateEmbedding(chunkText, tenantId, correlationId),
                    multilingualService.generateEmbedding(chunkText)
                ]);

                // 2. Shadow Embedding
                let embeddingShadow: number[] | undefined;
                if (translatedText) {
                    embeddingShadow = await generateEmbedding(translatedText, tenantId, correlationId);
                }

                const durationEmbed = Date.now() - startEmbed;

                if (durationEmbed > 5000) {
                    console.log(`⚠️  [INGEST] Chunk embed took ${durationEmbed}ms`);
                }

                // Usage Tracking
                await UsageService.trackEmbedding(tenantId, 1, 'text-embedding-004', correlationId);
                if (translatedText) {
                    await UsageService.trackEmbedding(tenantId, 1, 'text-embedding-004-shadow', correlationId);
                }
                if (embeddingBGE.length > 0) {
                    await UsageService.trackEmbedding(tenantId, 1, 'bge-m3-local', correlationId);
                }

                // --- Insert Original Chunk ---
                const originalChunkId = new ObjectId();
                const documentChunk = {
                    _id: originalChunkId,
                    tenantId,
                    industry: "ELEVATORS",
                    componentType: metadata.type,
                    model: primaryModel,
                    sourceDoc: file.name,
                    version: metadata.version,
                    revisionDate: new Date(),
                    language: detectedLang,
                    chunkText: chunkText,
                    translatedText: translatedText,
                    embedding: embeddingGemini,
                    embedding_multilingual: embeddingBGE,
                    cloudinaryUrl: cloudinaryResult.secureUrl,
                    isShadow: false,
                    createdAt: new Date(),
                };

                const validatedChunk = DocumentChunkSchema.parse(documentChunk);
                await documentChunksCollection.insertOne(validatedChunk);

                // --- Insert Shadow Chunk ---
                if (translatedText && embeddingShadow) {
                    const shadowChunk = {
                        tenantId,
                        industry: "ELEVATORS",
                        componentType: metadata.type,
                        model: primaryModel,
                        sourceDoc: file.name,
                        version: metadata.version,
                        revisionDate: new Date(),
                        language: 'es',
                        originalLang: detectedLang,
                        chunkText: translatedText,
                        refChunkId: originalChunkId,
                        embedding: embeddingShadow,
                        cloudinaryUrl: cloudinaryResult.secureUrl,
                        isShadow: true,
                        createdAt: new Date(),
                    };

                    const validatedShadow = DocumentChunkSchema.parse(shadowChunk);
                    await documentChunksCollection.insertOne(validatedShadow);
                }
            }));

            await logEvento({
                level: 'INFO',
                source: 'API_INGEST',
                action: 'BATCH_PROCESSED',
                message: `Processed batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)}`,
                correlationId,
                details: { batchIndex: i / BATCH_SIZE, totalChunks: chunks.length }
            });
        }

        // AUTO-AUDIT: Success
        const auditEntry = {
            tenantId,
            performedBy: userEmail,
            ip,
            userAgent,
            filename: file.name,
            fileSize: file.size,
            md5: fileHash,
            docId: docId,
            correlationId,
            status: 'SUCCESS' as const,
            details: {
                chunks: chunks.length,
                duration_ms: Date.now() - start,
            }
        };

        await db.collection('audit_ingestion').insertOne(IngestAuditSchema.parse(auditEntry));

        return NextResponse.json({
            success: true,
            correlationId,
            message: `Document processed successfully with Dual-Indexing (${chunks.length} chunks)`,
            chunks: chunks.length,
            language: detectedLang
        });

    } catch (error: any) {
        console.error(`[INGEST ERROR] Correlation: ${correlationId}`, error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                new ValidationError('Invalid ingest metadata', error.errors).toJSON(),
                { status: 400 }
            );
        }

        if (error instanceof AppError || error?.name === 'AppError') {
            const appError = error instanceof AppError ? error : new AppError(error.code, error.status, error.message, error.details);
            return NextResponse.json(appError.toJSON(), { status: appError.status });
        }

        await logEvento({
            level: 'ERROR',
            source: 'API_INGEST',
            action: 'FATAL_ERROR',
            message: error.message || 'Unknown error',
            correlationId,
            stack: error.stack
        });

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Critical ingest error',
                    details: error.message
                }
            },
            { status: 500 }
        );
    } finally {
        const duration = Date.now() - start;
        if (duration > 20000) {
            await logEvento({
                level: 'WARN',
                source: 'API_INGEST',
                action: 'SLA_VIOLATION',
                message: `Heavy ingest: ${duration}ms`,
                correlationId,
                details: { durationMs: duration }
            });
        }
    }
}

