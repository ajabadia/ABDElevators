import { NextResponse } from 'next/server';
import { publicApiHandler } from '@/lib/api-handler';
import { connectDB } from '@/lib/db';
import { DocumentChunkSchema, KnowledgeAssetSchema, IngestAuditSchema } from '@/lib/schemas';
import { generateEmbedding, extractModelsWithGemini, callGeminiMini } from '@/lib/llm';
import { chunkText } from '@/lib/chunk-utils';
import { PromptService } from '@/lib/prompt-service';
import { validateLanguageCode } from '@/lib/language-validator';
import { UsageService } from '@/lib/usage-service';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import crypto from 'crypto';

const IngestV1Schema = z.object({
    text: z.string().min(50, "Content too short (min 50 chars)"),
    metadata: z.object({
        type: z.string().min(1), // e.g. "manual", "troubleshooting", "datasheet"
        title: z.string().min(1), // e.g. "Manual Orona Arca II"
        model: z.string().optional(),
        version: z.string().default('1.0'),
        language: z.string().length(2).optional(),
        chunkingLevel: z.enum(['bajo', 'medio', 'alto']).optional()
    })
});

export const POST = publicApiHandler(
    'documents:ingest',
    async (req, { tenantId, apiKeyId, correlationId }) => {
        const body = await req.json();
        const { text, metadata } = IngestV1Schema.parse(body);
        const start = Date.now();

        // 0. Deduplication (MD5 of text content)
        const contentHash = crypto.createHash('md5').update(text).digest('hex');
        const db = await connectDB();
        const existingDoc = await db.collection('knowledge_assets').findOne({ fileMd5: contentHash, tenantId });

        if (existingDoc) {
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
        const assetData = {
            tenantId,
            filename: metadata.title, // Map title to filename for consistency
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
        };

        const validatedAsset = KnowledgeAssetSchema.parse(assetData);
        const insertResult = await db.collection('knowledge_assets').insertOne(validatedAsset);
        const docId = insertResult.insertedId;

        // 4. Save Chunks (with Embeddings)
        const { multilingualService } = await import('@/lib/multilingual-service');

        await Promise.all(chunks.map(async (chunkText) => {
            const [embeddingGemini, embeddingBGE] = await Promise.all([
                generateEmbedding(chunkText, tenantId, correlationId),
                multilingualService.generateEmbedding(chunkText)
            ]);

            await UsageService.trackEmbedding(tenantId, 1, 'text-embedding-004', correlationId);

            const chunkData = {
                tenantId,
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
                documentTypeId: docId.toString(),
                createdAt: new Date(),
            };

            const validatedChunk = DocumentChunkSchema.parse(chunkData);
            await db.collection('document_chunks').insertOne(validatedChunk);
        }));

        // 5. Audit
        const auditEntry = {
            tenantId,
            performedBy: `API:${apiKeyId}`,
            filename: metadata.title,
            fileSize: text.length,
            md5: contentHash,
            docId: docId,
            correlationId,
            status: 'SUCCESS' as const,
            details: {
                chunks: chunks.length,
                duration_ms: Date.now() - start,
                source: 'API_V1_JSON'
            }
        };
        await db.collection('audit_ingestion').insertOne(IngestAuditSchema.parse(auditEntry));

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
);
