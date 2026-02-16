
import { getTenantCollection } from '@/lib/db-tenant';
import { IngestAuditSchema } from '@/lib/schemas';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { FeatureFlags } from '@/lib/feature-flags';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { IngestPreparer } from './ingest/IngestPreparer';
import { IngestAnalyzer } from './ingest/IngestAnalyzer';
import { IngestIndexer } from './ingest/IngestIndexer';
import { getSignedUrl, uploadPDFToCloudinary } from '@/lib/cloudinary';
import { GraphExtractionService } from './graph-extraction-service';
import { GridFSUtils } from '@/lib/gridfs-utils';

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
        chunkingLevel?: 'SIMPLE' | 'SEMANTIC' | 'LLM' | 'bajo' | 'medio' | 'alto'; // Phase 134: Tiered Chunking
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

        // Phase 131: Check feature flag early (accessible throughout function)
        const isV2Enabled = FeatureFlags.isIngestPipelineV2Enabled();

        try {
            await updateProgress(5);

            // Phase 131: Fetch buffer - Feature flag controlled
            let buffer: Buffer;

            // Log feature flag status
            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'PIPELINE_VERSION',
                message: `Ingest pipeline v2 enabled: ${isV2Enabled}`,
                correlationId,
                tenantId: asset.tenantId,
                details: { isV2Enabled, hasBlobId: !!asset.blobId, hasCloudinaryUrl: !!asset.cloudinaryUrl }
            });

            if (isV2Enabled && asset.blobId) {
                // Phase 131: Try to fetch from GridFS first
                await logEvento({
                    level: 'INFO',
                    source: 'INGEST_SERVICE',
                    action: 'BLOB_FETCH_START',
                    message: `Fetching file from GridFS blob: ${asset.blobId}`,
                    correlationId,
                    tenantId: asset.tenantId
                });

                try {
                    buffer = await GridFSUtils.getForProcessing(asset.blobId, correlationId);
                    await logEvento({
                        level: 'INFO',
                        source: 'INGEST_SERVICE',
                        action: 'BLOB_FETCH_SUCCESS',
                        message: `File fetched from GridFS (${buffer.length} bytes).`,
                        correlationId,
                        tenantId: asset.tenantId
                    });
                } catch (blobError) {
                    await logEvento({
                        level: 'WARN',
                        source: 'INGEST_SERVICE',
                        action: 'BLOB_FETCH_FAILED',
                        message: `GridFS blob not found, falling back to Cloudinary: ${asset.blobId}`,
                        correlationId,
                        tenantId: asset.tenantId,
                        details: { blobError: (blobError as Error).message }
                    });
                    // Fallback to Cloudinary
                    buffer = await this.fetchFromCloudinary(asset, correlationId);
                }
            } else {
                // Legacy: Fetch from Cloudinary directly
                await logEvento({
                    level: 'INFO',
                    source: 'INGEST_SERVICE',
                    action: 'CLOUDFINARY_FETCH_START',
                    message: `No blobId found, fetching from Cloudinary (legacy path)`,
                    correlationId,
                    tenantId: asset.tenantId
                });
                buffer = await this.fetchFromCloudinary(asset, correlationId);
            }

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
                updateProgress,
                asset.chunkingLevel // Phase 134
            );
            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'INDEXING_SUCCESS',
                message: `Indexing complete. ${successCount} chunks processed.`,
                correlationId,
                tenantId: asset.tenantId
            });

            // Step 4: Graph Extraction (Phase 122) - Feature Flag Controlled (Phase 135)
            if (FeatureFlags.isGraphRagEnabled()) {
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
            } else {
                await logEvento({
                    level: 'INFO',
                    source: 'INGEST_SERVICE',
                    action: 'GRAPH_EXTRACTION_SKIPPED',
                    message: `Graph extraction skipped (Feature Flag disabled).`,
                    correlationId,
                    tenantId: asset.tenantId
                });
            }

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

            // Phase 131: Mark chunks as created
            await knowledgeAssetsCollection.updateOne(
                { _id: assetId },
                {
                    $set: {
                        hasChunks: true,
                        indexingError: null,
                        updatedAt: new Date()
                    }
                }
            );

            // Phase 131: Upload to Cloudinary (non-blocking, after chunks) - Only if v2 enabled
            if (isV2Enabled) {
                await logEvento({
                    level: 'INFO',
                    source: 'INGEST_SERVICE',
                    action: 'CLOUDFINARY_ASYNC_START',
                    message: `Starting async upload to Cloudinary (v2 pipeline)`,
                    correlationId,
                    tenantId: asset.tenantId
                });

                this.uploadToCloudinaryAsync(buffer, asset, correlationId).then(async (cloudinaryResult) => {
                    if (cloudinaryResult.success) {
                        await knowledgeAssetsCollection.updateOne(
                            { _id: assetId },
                            {
                                $set: {
                                    hasStorage: true,
                                    cloudinaryUrl: cloudinaryResult.url,
                                    cloudinaryPublicId: cloudinaryResult.publicId,
                                    storageError: null,
                                    updatedAt: new Date()
                                }
                            }
                        );
                    }
                }).catch(async (uploadError) => {
                    await logEvento({
                        level: 'WARN',
                        source: 'INGEST_SERVICE',
                        action: 'CLOUDFINARY_UPLOAD_FAILED',
                        message: `Failed to upload to Cloudinary after indexing: ${uploadError}`,
                        correlationId,
                        tenantId: asset.tenantId
                    });
                    await knowledgeAssetsCollection.updateOne(
                        { _id: assetId },
                        {
                            $set: {
                                storageError: (uploadError as Error).message,
                                updatedAt: new Date()
                            }
                        }
                    );
                });
            } else {
                // Legacy mode
                await knowledgeAssetsCollection.updateOne(
                    { _id: assetId },
                    { $set: { hasStorage: true, hasChunks: true, updatedAt: new Date() } }
                );
            }

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

    // ============================================================================
    // Phase 131: Helper Methods for Cloudinary Decoupling
    // ============================================================================

    /**
     * Fetch file buffer from Cloudinary (legacy fallback)
     */
    private static async fetchFromCloudinary(
        asset: any,
        correlationId: string
    ): Promise<Buffer> {
        if (!asset.cloudinaryUrl) {
            throw new AppError('EXTERNAL_SERVICE_ERROR', 503, `Missing Cloudinary URL for asset. Record may be corrupted.`);
        }

        const signedUrl = getSignedUrl(asset.cloudinaryPublicId || asset.cloudinary_public_id, 'raw');

        await logEvento({
            level: 'INFO',
            source: 'INGEST_SERVICE',
            action: 'CLOUDFINARY_FETCH_START',
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
            action: 'CLOUDFINARY_FETCH_SUCCESS',
            message: `File fetched from Cloudinary (${buffer.length} bytes).`,
            correlationId,
            tenantId: asset.tenantId
        });

        return buffer;
    }

    /**
     * Upload buffer to Cloudinary (non-blocking, after chunks created)
     * Phase 131: Called after indexing to avoid blocking chunk creation
     */
    private static async uploadToCloudinaryAsync(
        buffer: Buffer,
        asset: any,
        correlationId: string
    ): Promise<{ success: boolean; url?: string; publicId?: string; error?: string }> {
        try {
            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'CLOUDFINARY_UPLOAD_START',
                message: `Uploading file to Cloudinary (non-blocking)...`,
                correlationId,
                tenantId: asset.tenantId
            });

            const result = await uploadPDFToCloudinary(
                buffer,
                asset.filename,
                asset.tenantId
            );

            await logEvento({
                level: 'INFO',
                source: 'INGEST_SERVICE',
                action: 'CLOUDFINARY_UPLOAD_SUCCESS',
                message: `File uploaded to Cloudinary: ${result.publicId}`,
                correlationId,
                tenantId: asset.tenantId
            });

            return {
                success: true,
                url: result.secureUrl,
                publicId: result.publicId
            };
        } catch (error) {
            const err = error as Error;
            await logEvento({
                level: 'ERROR',
                source: 'INGEST_SERVICE',
                action: 'CLOUDFINARY_UPLOAD_ERROR',
                message: `Failed to upload to Cloudinary: ${err.message}`,
                correlationId,
                tenantId: asset.tenantId
            });

            return {
                success: false,
                error: err.message
            };
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
