
import { getTenantCollection } from '@/lib/db-tenant';
import { IngestAuditSchema } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { IngestPreparer } from './ingest/IngestPreparer';
import { IngestAnalyzer } from './ingest/IngestAnalyzer';
import { IngestIndexer } from './ingest/IngestIndexer';
import { getSignedUrl } from '@/lib/cloudinary';
import { GraphExtractionService } from './graph-extraction-service';

export interface IngestOptions {
    file: File | { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
    metadata: {
        type: string;
        version: string;
        documentTypeId?: string;
        scope?: 'USER' | 'TENANT' | 'INDUSTRY' | 'GLOBAL';
        industry?: string;
        ownerUserId?: string; // For USER scope
        spaceId?: string; // 🌌 Phase 125.2: Target Space
    };
    tenantId: string;
    userEmail: string;
    environment?: string;
    ip?: string;
    userAgent?: string;
    correlationId?: string;
    maskPii?: boolean;
    session?: any;
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
        const start = Date.now();
        const job = options.job;

        const knowledgeAssetsCollection = await getTenantCollection('knowledge_assets', { user: { tenantId: 'platform_master', role: 'SUPER_ADMIN' } });
        const assetId = new ObjectId(docId);
        const asset = await knowledgeAssetsCollection.findOne({ _id: assetId });

        if (!asset) {
            throw new AppError('NOT_FOUND', 404, `Knowledge asset ${docId} not found`);
        }

        const correlationId = options.correlationId || asset.correlationId || crypto.randomUUID();

        // Construct a technical session for the worker
        const workerSession = {
            user: {
                id: 'system_worker',
                email: options.userEmail || asset.uploadedBy || 'system@abd.com',
                tenantId: asset.tenantId || options.tenantId || 'platform_master',
                role: 'ADMIN', // Worker needs enough privileges to write chunks
            }
        };

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
            if (!asset.cloudinaryUrl) {
                throw new AppError('EXTERNAL_SERVICE_ERROR', 503, `Missing Cloudinary URL for asset ${assetId}. Record may be corrupted.`);
            }

            // Generate a SIGNED URL for secure internal fetch
            const signedUrl = getSignedUrl(asset.cloudinaryPublicId || asset.cloudinary_public_id, 'raw');

            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'FETCH_START',
                message: `Fetching file from Cloudinary using signed URL...`,
                correlationId,
                tenantId: asset.tenantId
            });

            const response = await fetch(signedUrl);
            if (!response.ok) {
                throw new Error(`Cloudinary fetch failed: [${response.status} ${response.statusText}] for URL: ${asset.cloudinaryUrl}`);
            }
            const buffer = Buffer.from(await response.arrayBuffer());

            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'FETCH_SUCCESS',
                message: `File fetched successfully (${buffer.length} bytes).`,
                correlationId,
                tenantId: asset.tenantId
            });

            await updateProgress(15);

            // Step 2: Full Analysis
            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'ANALYSIS_START',
                message: `Starting Document Analysis...`,
                correlationId,
                tenantId: asset.tenantId
            });
            const analysis = await IngestAnalyzer.analyze(buffer, asset, correlationId, workerSession);
            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'ANALYSIS_SUCCESS',
                message: `Analysis complete. Lang: ${analysis.detectedLang}, Industry: ${analysis.detectedIndustry}`,
                correlationId,
                tenantId: asset.tenantId
            });
            await updateProgress(60);

            // Step 3: Indexing
            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'INDEXING_START',
                message: `Starting Document Indexing...`,
                correlationId,
                tenantId: asset.tenantId
            });
            const successCount = await IngestIndexer.index(
                analysis.rawText,
                analysis.visualFindings,
                asset,
                analysis.documentContext,
                analysis.detectedIndustry,
                analysis.detectedLang,
                correlationId,
                workerSession,
                updateProgress
            );
            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'INDEXING_SUCCESS',
                message: `Indexing complete. ${successCount} chunks processed.`,
                correlationId,
                tenantId: asset.tenantId
            });

            // Step 4: Graph Extraction (Phase 122)
            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'GRAPH_EXTRACTION_START',
                message: `Extracting entities and relations for Knowledge Graph...`,
                correlationId,
                tenantId: asset.tenantId
            });
            await GraphExtractionService.extractAndPersist(
                analysis.rawText,
                asset.tenantId,
                correlationId,
                { sourceDoc: asset.filename }
            ).catch(e => console.error('[GRAPH_EXTRACTION_ERROR]', e));

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

            await (await getTenantCollection('audit_ingestion', workerSession)).insertOne(IngestAuditSchema.parse({
                tenantId: asset.tenantId,
                performedBy: options.userEmail || asset.uploadedBy || 'system_worker',
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

        // Ensure options has the correlationId from prep
        const updatedOptions = { ...options, correlationId: prep.correlationId };

        if (prep.status === 'DUPLICATE') {
            return { success: true, correlationId: prep.correlationId, message: "Duplicate", chunks: 0, isDuplicate: true };
        }
        return this.executeAnalysis(prep.docId, updatedOptions);
    }
}
