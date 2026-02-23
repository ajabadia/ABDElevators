import crypto from 'crypto';
import { IngestPreparer } from './IngestPreparer';
import { IngestAnalyzer } from './IngestAnalyzer';
import { IngestIndexer } from './IngestIndexer';
import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { IngestStorageService } from './IngestStorageService';
import { IngestAuditService } from './IngestAuditService';
import { IngestStrategyService } from './IngestStrategyService';
import { GraphExtractionService } from '@/services/core/graph-extraction-service';
import { IngestOptions, IngestResult } from './types';
import { StateTransitionValidator, IngestState } from './core/StateTransitionValidator';

export interface EnrichmentOptions extends Partial<IngestOptions> {
    isEnrichment: boolean;
    job?: any;
}

/**
 * IngestService: Orchestrator for the RAG ingestion pipeline.
 * Refactored Phase 213: Delegating logic to specialized modules.
 */
export class IngestService {

    static async prepareIngest(options: IngestOptions) {
        return await IngestPreparer.prepare(options);
    }

    static async executeAnalysis(docId: string, options: EnrichmentOptions): Promise<IngestResult> {
        const start = Date.now();
        const asset = await knowledgeAssetRepository.findById(docId);

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

        await knowledgeAssetRepository.update(docId, {
            $set: { ingestionStatus: 'PROCESSING', attempts: (asset.attempts || 0) + 1, updatedAt: new Date() }
        });

        const updateProgress = async (percent: number) => {
            if (options.job) await options.job.updateProgress(percent);
            await knowledgeAssetRepository.update(docId, { $set: { progress: percent, updatedAt: new Date() } });
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
                if (options.isEnrichment) {
                    // Solo indexamos los hallazgos visuales para evitar duplicar el texto base
                    if (analysis.visualFindings.length > 0) {
                        processedChunks = await IngestIndexer.index(
                            "", analysis.visualFindings, asset, analysis.documentContext,
                            analysis.detectedIndustry, analysis.detectedLang, correlationId, workerSession,
                            updateProgress, asset.chunkingLevel,
                            { size: options.chunkSize, overlap: options.chunkOverlap, threshold: options.chunkThreshold }
                        );
                    }
                } else {
                    processedChunks = await IngestIndexer.index(
                        analysis.rawText, analysis.visualFindings, asset, analysis.documentContext,
                        analysis.detectedIndustry, analysis.detectedLang, correlationId, workerSession,
                        updateProgress, asset.chunkingLevel,
                        { size: options.chunkSize, overlap: options.chunkOverlap, threshold: options.chunkThreshold }
                    );
                }
            }

            // 4. Graph Extraction
            if (IngestStrategyService.shouldExecuteGraphRag(asset)) {
                await GraphExtractionService.extractAndPersist(
                    analysis.rawText, asset.tenantId, correlationId, { sourceDoc: asset.filename }
                ).catch((e: any) => console.error('[GRAPH_ERROR]', e));
            }

            // 5. Finalize
            await StateTransitionValidator.transition('PROCESSING', 'COMPLETED', {
                docId, correlationId, tenantId: asset.tenantId, userId: workerSession.user.email
            });

            await knowledgeAssetRepository.update(docId, {
                $set: {
                    ingestionStatus: 'COMPLETED',
                    progress: 100,
                    model: analysis.detectedModels[0]?.model || asset.model || 'UNKNOWN',
                    language: analysis.detectedLang || asset.language,
                    totalChunks: (asset.totalChunks || 0) + processedChunks,
                    industry: analysis.detectedIndustry || asset.industry,
                    contextHeader: analysis.documentContext || asset.contextHeader,
                    hasChunks: (asset.totalChunks || 0) + processedChunks > 0,
                    updatedAt: new Date()
                }
            });

            await IngestAuditService.logEvent({
                tenantId: asset.tenantId, performedBy: workerSession.user.email, filename: asset.filename,
                sizeBytes: asset.sizeBytes || 0, md5: asset.fileMd5, docId, correlationId, status: 'SUCCESS',
                details: { source: 'ASYNC_WORKER', chunks: processedChunks, duration_ms: Date.now() - start }
            });

            // 6. Async Storage (Cloudinary)
            if (IngestStrategyService.isV2Enabled()) {
                IngestStorageService.uploadToCloudinary(buffer, asset, correlationId).then(async (res) => {
                    if (res.success) {
                        await knowledgeAssetRepository.update(docId, {
                            $set: { hasStorage: true, cloudinaryUrl: res.url, cloudinaryPublicId: res.publicId, updatedAt: new Date() }
                        });
                    }
                });
            }

            return { success: true, correlationId, message: "Processed", chunks: processedChunks };

        } catch (error: any) {
            await knowledgeAssetRepository.update(docId, {
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
        return this.executeAnalysis(prep.docId, { ...options, correlationId: prep.correlationId, isEnrichment: false });
    }
}
