
import crypto from 'crypto';
import { IngestPreparer } from './IngestPreparer';
import { IngestAnalyzer } from './IngestAnalyzer';
import { IngestIndexer } from './IngestIndexer';
import { KnowledgeAssetRepository } from './KnowledgeAssetRepository';
import { IngestStorageService } from './IngestStorageService';
import { IngestAuditService } from './IngestAuditService';
import { IngestStrategyService } from './IngestStrategyService';
import { GraphExtractionService } from '../graph-extraction-service';
import { IngestOptions, IngestResult } from './types';
import { StateTransitionValidator, IngestState } from './core/StateTransitionValidator';

/**
 * IngestService: Orchestrator for the RAG ingestion pipeline.
 * Refactored Phase 213: Delegating logic to specialized modules.
 */
export class IngestService {

    static async prepareIngest(options: IngestOptions) {
        return await IngestPreparer.prepare(options);
    }

    static async executeAnalysis(docId: string, options: Partial<IngestOptions> & { job?: any }): Promise<IngestResult> {
        const start = Date.now();
        const asset = await KnowledgeAssetRepository.findById(docId);

        if (!asset) throw new Error(`Asset ${docId} not found`);

        const correlationId = options.correlationId || asset.correlationId || crypto.randomUUID();
        const workerSession = {
            user: {
                id: 'system_worker',
                email: options.userEmail || asset.uploadedBy || 'system@abd.com',
                tenantId: asset.tenantId || 'platform_master',
                role: 'ADMIN'
            }
        };

        // Transition FSM
        await StateTransitionValidator.transition(asset.ingestionStatus as IngestState, 'PROCESSING', {
            docId, correlationId, tenantId: asset.tenantId, userId: workerSession.user.email
        });

        await KnowledgeAssetRepository.update(docId, {
            $set: { ingestionStatus: 'PROCESSING', attempts: (asset.attempts || 0) + 1, updatedAt: new Date() }
        });

        const updateProgress = async (percent: number) => {
            if (options.job) await options.job.updateProgress(percent);
            await KnowledgeAssetRepository.update(docId, { $set: { progress: percent, updatedAt: new Date() } });
        };

        try {
            await updateProgress(5);

            // 1. Fetch Buffer
            const buffer = await IngestStorageService.getBuffer(asset, correlationId);
            await updateProgress(15);

            // 2. Analysis
            const analysisOptions = IngestStrategyService.getAnalysisOptions(asset, options);
            const analysis = await IngestAnalyzer.analyze(buffer, asset, correlationId, workerSession, analysisOptions);
            await updateProgress(60);

            // 3. Indexing
            let processedChunks = 0;
            if (!asset.skipIndexing && !options.metadata?.skipIndexing) {
                processedChunks = await IngestIndexer.index(
                    analysis.rawText, analysis.visualFindings, asset, analysis.documentContext,
                    analysis.detectedIndustry, analysis.detectedLang, correlationId, workerSession,
                    updateProgress, asset.chunkingLevel,
                    { size: options.chunkSize, overlap: options.chunkOverlap, threshold: options.chunkThreshold }
                );
            }

            // 4. Graph Extraction
            if (IngestStrategyService.shouldExecuteGraphRag(asset)) {
                await GraphExtractionService.extractAndPersist(
                    analysis.rawText, asset.tenantId, correlationId, { sourceDoc: asset.filename }
                ).catch(e => console.error('[GRAPH_ERROR]', e));
            }

            // 5. Finalize
            await StateTransitionValidator.transition('PROCESSING', 'COMPLETED', {
                docId, correlationId, tenantId: asset.tenantId, userId: workerSession.user.email
            });

            await KnowledgeAssetRepository.update(docId, {
                $set: {
                    ingestionStatus: 'COMPLETED',
                    progress: 100,
                    model: analysis.detectedModels[0]?.model || 'UNKNOWN',
                    language: analysis.detectedLang,
                    totalChunks: processedChunks,
                    industry: analysis.detectedIndustry,
                    contextHeader: analysis.documentContext,
                    hasChunks: processedChunks > 0,
                    updatedAt: new Date()
                }
            });

            await IngestAuditService.log({
                tenantId: asset.tenantId, performedBy: workerSession.user.email, filename: asset.filename,
                sizeBytes: asset.sizeBytes || 0, md5: asset.fileMd5, docId, correlationId, status: 'SUCCESS',
                details: { source: 'ASYNC_WORKER', chunks: processedChunks, duration_ms: Date.now() - start }
            });

            // 6. Async Storage (Cloudinary)
            if (IngestStrategyService.isV2Enabled()) {
                IngestStorageService.uploadToCloudinary(buffer, asset, correlationId).then(async (res) => {
                    if (res.success) {
                        await KnowledgeAssetRepository.update(docId, {
                            $set: { hasStorage: true, cloudinaryUrl: res.url, cloudinaryPublicId: res.publicId, updatedAt: new Date() }
                        });
                    }
                });
            }

            return { success: true, correlationId, message: "Processed", chunks: processedChunks };

        } catch (error: any) {
            await KnowledgeAssetRepository.update(docId, {
                $set: { ingestionStatus: 'FAILED', error: error.message, updatedAt: new Date() }
            });
            throw error;
        }
    }

    static async processDocument(options: IngestOptions): Promise<IngestResult> {
        const prep = await this.prepareIngest(options);
        if (prep.status === 'DUPLICATE') {
            return { success: true, correlationId: prep.correlationId, message: "Duplicate", chunks: 0, isDuplicate: true };
        }
        return this.executeAnalysis(prep.docId, { ...options, correlationId: prep.correlationId });
    }
}
