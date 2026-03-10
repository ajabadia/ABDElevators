import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { publicApiHandler } from '@/lib/api-handler';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { connectDB } from '@/lib/db';
import { DocumentChunkSchema, KnowledgeAssetSchema, IngestAuditSchema } from '@/lib/schemas';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';
import { generateEmbedding, extractModelsWithGemini, callGeminiMini } from '@/services/llm/llm-service';
import { chunkText } from '@/lib/chunk-utils';
import { PromptService } from '@/services/llm/prompt-service';
import { UsageService } from '@/services/ops/usage-service';
import { validateLanguageCode } from '@/services/core/LanguageValidator';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const IngestV1Schema = z.object({
    text: z.string().min(50, "Content too short (min 50 chars)"),
    metadata: z.object({
        type: z.string().min(1), // e.g. "manual", "troubleshooting", "datasheet"
        title: z.string().min(1), // e.g. "Manual Orona Arca II"
        model: z.string().optional(),
        version: z.string().default('1.0'),
        language: z.string().length(2).optional(),
        chunkingLevel: z.enum(['bajo', 'medio', 'alto']).optional(),

        // Phase 351: Relational Alignment
        spaceId: z.string().optional(),
        documentTypeId: z.string().optional()
    })
});

export const POST = withPerformanceSLA(
    publicApiHandler(
        'documents:ingest',
        async (req, { tenantId, apiKeyId, correlationId }) => {
            const body = await req.json();
            const { text, metadata } = IngestV1Schema.parse(body);
            const start = Date.now();

            // 0. Deduplication (MD5 of text content)
            const contentHash = crypto.createHash('md5').update(text).digest('hex');
            const db = await connectDB();
            const existingDoc = await db.collection('knowledge_assets').findOne({ fileMd5: contentHash, tenantId });

            if (existingDoc && existingDoc._id) {
                return NextResponse.json({
                    success: true,
                    message: "Document already ingested (Duplicate content)",
                    docId: existingDoc._id
                });
            }

            // 1. Detect Language & Models (if not provided)
            let detectedLang = metadata.language;
            if (!detectedLang) {
                const { text: languagePrompt, model: langModel } = await PromptService.getRenderedPrompt(
                    'LANGUAGE_DETECTOR',
                    { text: text.substring(0, 500) },
                    tenantId
                );
                detectedLang = (await callGeminiMini(languagePrompt, tenantId, { correlationId, model: langModel })).trim().toLowerCase().substring(0, 2);
            }
            detectedLang = validateLanguageCode(detectedLang);

            let primaryModel = metadata.model || 'UNKNOWN';
            if (primaryModel === 'UNKNOWN') {
                const detectedModels = await extractModelsWithGemini(text.substring(0, 3000), tenantId, correlationId);
                if (detectedModels.length > 0) primaryModel = detectedModels[0].model;
            }

            // 2. Chunking
            const chunks = await chunkText(text);

            // 3. Save Asset Metadata
            const tId = TenantIdSchema.parse(tenantId);

            // Fallbacks for mandatory fields (Isla 1 containment)
            const spaceId = metadata.spaceId ? EntityIdSchema.parse(metadata.spaceId) : EntityIdSchema.parse('000000000000000000000000');
            const documentTypeId = metadata.documentTypeId ? EntityIdSchema.parse(metadata.documentTypeId) : EntityIdSchema.parse('000000000000000000000000');

            const assetData = {
                tenantId: tId,
                filename: metadata.title,
                componentType: metadata.type,
                model: primaryModel,
                version: metadata.version,
                revisionDate: new Date(),
                language: detectedLang,
                chunkingLevel: metadata.chunkingLevel || 'bajo',
                status: 'vigente' as const,
                fileMd5: contentHash,
                totalChunks: chunks.length,
                createdAt: new Date(),
                spaceId,
                documentTypeId
            };

            const validatedAsset = KnowledgeAssetSchema.parse(assetData);
            const insertResult = await db.collection('knowledge_assets').insertOne(validatedAsset as any);
            const docId = insertResult.insertedId;

            // 4. Save Chunks (with Embeddings)
            const { multilingualService } = await import('@/services/core/multilingual-service');

            await Promise.all(chunks.map(async (chunkText) => {
                const [embeddingGemini, embeddingBGE] = await Promise.all([
                    generateEmbedding(chunkText, tenantId, correlationId),
                    multilingualService.generateEmbedding(chunkText)
                ]);

                await UsageService.trackEmbedding(tenantId, 1, 'text-embedding-004', correlationId);

                const chunkData = {
                    tenantId: tId,
                    industry: "ELEVATORS",
                    componentType: metadata.type,
                    model: primaryModel,
                    sourceDoc: metadata.title,
                    version: metadata.version,
                    revisionDate: new Date(),
                    language: detectedLang,
                    chunkText: chunkText,
                    embedding: embeddingGemini,
                    embedding_multilingual: embeddingBGE,
                    assetId: EntityIdSchema.parse(docId.toString()), // CORRECT FIELD
                    documentTypeId: documentTypeId, // CORRECT FIELD
                    createdAt: new Date(),
                };

                const validatedChunk = DocumentChunkSchema.parse(chunkData);
                await db.collection('document_chunks').insertOne(validatedChunk as any);
            }));

            // 5. Audit
            const auditEntry = {
                tenantId: tId,
                performedBy: EntityIdSchema.parse('000000000000000000000000'), // System or API user placeholder
                filename: metadata.title,
                sizeBytes: text.length,
                md5: contentHash,
                docId: EntityIdSchema.parse(docId.toString()),
                correlationId,
                status: 'SUCCESS' as const,
                details: {
                    chunks: chunks.length,
                    duration_ms: Date.now() - start,
                    source: 'API_V1_JSON'
                }
            };
            await db.collection('audit_ingestion').insertOne(auditEntry as any);

            return NextResponse.json({
                success: true,
                docId: docId,
                chunks: chunks.length,
                detected: {
                    language: detectedLang,
                    model: primaryModel
                }
            });
        }
    ),
    { endpoint: 'V1_DOCUMENTS_INGEST', thresholdMs: 10000, source: 'API_V1' }
);
