
import { getTenantCollection } from '@/lib/db-tenant';
import { IngestAuditSchema } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { IngestPreparer } from './ingest/IngestPreparer';
import { IngestAnalyzer } from './ingest/IngestAnalyzer';
import { IngestIndexer } from './ingest/IngestIndexer';

export interface IngestOptions {
    file: File | { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
    metadata: {
        type: string;
        version: string;
        documentTypeId?: string;
        scope?: 'GLOBAL' | 'INDUSTRY' | 'TENANT';
        industry?: string;
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

/**
 * IngestService: Orchestrator for the RAG ingestion pipeline (Phase 105 Hygiene).
 * Implements Rule #11 (Multi-tenant Harmony) and modular design.
 */
export class IngestService {
    /**
     * Phase 1: Preparation (Synchronous)
     */
    static async prepareIngest(options: IngestOptions) {
        return await IngestPreparer.prepare(options);
    }

    /**
     * Phase 2 & 3: Heavy Analysis & Indexing (Asynchronous)
     */
    static async executeAnalysis(docId: string, options: Partial<IngestOptions> & { job?: any }): Promise<IngestResult> {
        const correlationId = options.correlationId || crypto.randomUUID();
        const start = Date.now();
        const job = options.job;

        const knowledgeAssetsCollection = await getTenantCollection('knowledge_assets');
        const assetId = new ObjectId(docId);
        const asset = await knowledgeAssetsCollection.findOne({ _id: assetId });

        if (!asset) {
            throw new AppError('NOT_FOUND', 404, `Knowledge asset ${docId} not found`);
        }

        const currentAttempts = (asset.attempts || 0) + 1;

        await knowledgeAssetsCollection.updateOne(
            { _id: assetId },
            { $set: { ingestionStatus: 'PROCESSING', attempts: currentAttempts, updatedAt: new Date() } }
        );

        const updateProgress = async (percent: number) => {
            if (job) await job.updateProgress(percent);
            await knowledgeAssetsCollection.updateOne(
                { _id: assetId },
                { $set: { progress: percent, updatedAt: new Date() } }
            );
        };

        try {
            await updateProgress(5);

            // Fetch from Cloudinary
            const response = await fetch(encodeURI(asset.cloudinaryUrl));
            if (!response.ok) throw new Error(`Failed to fetch from Cloudinary: ${response.statusText}`);
            const buffer = Buffer.from(await response.arrayBuffer());

            await updateProgress(15);

            // Step 2: Full Analysis
            const analysis = await IngestAnalyzer.analyze(buffer, asset, correlationId);
            await updateProgress(60);

            // Step 3: Indexing
            const successCount = await IngestIndexer.index(
                analysis.rawText,
                analysis.visualFindings,
                asset,
                analysis.documentContext,
                analysis.detectedIndustry,
                analysis.detectedLang,
                correlationId,
                updateProgress
            );

            // Final Update
            await knowledgeAssetsCollection.updateOne(
                { _id: assetId },
                {
                    $set: {
                        ingestionStatus: 'COMPLETED',
                        progress: 100,
                        model: analysis.detectedModels[0]?.model || 'UNKNOWN',
                        language: analysis.detectedLang,
                        totalChunks: successCount,
                        industry: analysis.detectedIndustry,
                        contextHeader: analysis.documentContext,
                        updatedAt: new Date()
                    }
                }
            );

            await (await getTenantCollection('audit_ingestion')).insertOne(IngestAuditSchema.parse({
                tenantId: asset.tenantId,
                performedBy: options.userEmail || 'system_worker',
                filename: asset.filename,
                fileSize: asset.sizeBytes || 0,
                md5: asset.fileMd5 || 'unknown',
                docId: assetId,
                correlationId,
                status: 'SUCCESS',
                details: { source: 'ASYNC_WORKER', chunks: successCount, duration_ms: Date.now() - start }
            }));

            return { success: true, correlationId, message: "Processed successfully", chunks: successCount };

        } catch (error: any) {
            console.error(`[INGEST_ERROR] ${docId}`, error);
            await knowledgeAssetsCollection.updateOne(
                { _id: assetId },
                { $set: { ingestionStatus: 'FAILED', error: error.message, updatedAt: new Date() } }
            );
            throw error;
        }
    }

    /**
     * Legacy Wrapper
     */
    static async processDocument(options: IngestOptions): Promise<IngestResult> {
        const prep = await this.prepareIngest(options);
        if (prep.status === 'DUPLICATE') {
            return { success: true, correlationId: prep.correlationId, message: "Duplicate", chunks: 0, isDuplicate: true };
        }
        return this.executeAnalysis(prep.docId, options);
    }
}
