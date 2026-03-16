import crypto from 'node:crypto';
import { IngestPreparer } from './IngestPreparer';
import { IngestAnalyzer } from './IngestAnalyzer';
import { IngestIndexer } from './IngestIndexer';
import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { GraphExtractionService } from '@/services/core/graph-extraction-service';
import { IngestOptions, IngestResult, EnrichmentOptions } from './types';
import { AppError } from '@/lib/errors';
import { type KnowledgeAsset } from '@/lib/schemas/assets';
import { UserRole } from '@/types/roles';
import { TenantSession } from '@/lib/db-tenant';
import { spaceRepository } from '@/lib/repositories/SpaceRepository';
import { Space } from '@/lib/schemas/spaces';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { getSystemSession } from '@/lib/sessions/system-session';

/**
 * 🚀 IngestService: Orchestrator for the Ingestion Pipeline (Phase 110)
 * 
 * Flow: Prepare -> Analyze -> Index
 * Hardened for Era 8: Strict types, central repository, atomic states.
 */
export class IngestService {
    static async ingest(options: IngestOptions): Promise<IngestResult> {
        const tenantId = (options.metadata as any)?.tenantId || options.tenantId;
        if (!tenantId) throw new Error('tenantId is required for ingestion orchestration');

        return await withCorrelation(
            { level: 'INFO', source: 'INGEST_SERVICE', action: 'INGEST_START', tenantId, correlationId: options.correlationId },
            async ({ log, correlationId }) => {
                // 🤖 Autopilot Check (FASE 251)
                const db = await (await import('@/lib/db')).connectDB();
                const config = await db.collection('tenant_configs').findOne({ tenantId });

                if (config?.autoOps?.enabled && config?.autoOps?.lastAction === 'INGEST_PAUSED') {
                    await log({
                        level: 'WARN',
                        action: 'INGEST_REJECTED_PAUSED',
                        message: `Ingestion rejected for tenant ${tenantId} due to active safety pause: ${config.autoOps.pauseReason}`,
                        details: { reason: config.autoOps.pauseReason }
                    });
                    return {
                        success: false,
                        status: 'FAILED',
                        correlationId,
                        message: `Ingestion is currently paused by Autopilot: ${config.autoOps.pauseReason || 'Critical errors detected'}`
                    };
                }

                // ⚖️ Policy & Quota Check (FASE 304)
                const { PolicyService } = await import('@/services/security/policy-service');
                const hasQuota = await PolicyService.validateQuotas(tenantId, 'STORAGE');
                if (!hasQuota) {
                    return {
                        success: false,
                        status: 'FAILED',
                        correlationId,
                        message: 'Storage quota exceeded for this tenant'
                    };
                }

                // 1. Prepare (Upload + Asset Creation)
                const assetData = await IngestPreparer.prepare(options);
                
                if (assetData.status === 'DUPLICATE') {
                    await log({
                        action: 'INGEST_DUPLICATE',
                        message: `Duplicate detected for ${options.metadata.filename}`,
                        details: { docId: assetData.docId, savings: assetData.savings }
                    });
                    return {
                        success: true,
                        status: 'DUPLICATE',
                        docId: assetData.docId,
                        correlationId,
                        isDuplicate: true,
                        savings: assetData.savings
                    };
                }

                // 2. Execute Analysis & Indexing
                return await this.executeAnalysis(assetData.docId, {
                    ...options,
                    correlationId,
                    tenantId
                });
            }
        );
    }

    /**
     * 🧬 executeAnalysis
     * Proposito: Ejecutar el pipeline de análisis e indexado para un asset ya preparado.
     * Útil para: Ingesta inicial y Regeneración/Enriquecimiento.
     */
    static async executeAnalysis(docId: string, options: EnrichmentOptions): Promise<IngestResult> {
        return await withCorrelation(
            { level: 'INFO', source: 'INGEST_SERVICE', action: 'EXECUTE_ANALYSIS', tenantId: options.tenantId, correlationId: options.correlationId },
            async ({ log, correlationId }) => {
                const tenantId = options.tenantId;
                if (!tenantId) throw new Error('tenantId is required for analysis execution');

                const workerSession: TenantSession = options.session || getSystemSession(tenantId, options.userEmail ? UserRole.USER : UserRole.SUPER_ADMIN);

                try {
                    const onProgress = async (p: number) => {
                        if (options.job?.updateProgress) {
                            await options.job.updateProgress(p);
                        }
                        // Persist to DB so UI reflects progress even in manual retries
                        await knowledgeAssetRepository.update(docId, {
                            progress: p,
                            updatedAt: new Date()
                        } as any, workerSession);
                    };

                    // 0. Initial state (ensure we are at 0% and PROCESSING)
                    await onProgress(0);
                    await knowledgeAssetRepository.update(docId, {
                        ingestionStatus: 'PROCESSING',
                        error: null // Clear previous errors if any
                    } as any, workerSession);

                    // 1. Analysis (Content Extraction + AI Models)
                    await onProgress(30);
                    
                    const assetForAnalysis = await knowledgeAssetRepository.getEntity(docId, workerSession);
                    if (!assetForAnalysis) throw new Error('Asset not found for analysis');

                    const { IngestStorageService } = await import('./IngestStorageService');
                    const buffer = await IngestStorageService.getBuffer(assetForAnalysis, correlationId);

                    const analysis = await IngestAnalyzer.analyze(
                        buffer,
                        assetForAnalysis as any,
                        correlationId,
                        workerSession,
                        options as any
                    );
                    
                    const { rawText, visualFindings, detectedIndustry, detectedLang } = analysis;

                    // 2. Indexing (Chunking + Embedding)
                    await onProgress(60);
                    
                    // Re-fetch to get any updates from analyzer
                    const asset = await knowledgeAssetRepository.getEntity(docId, workerSession);
                    const fullContext = `Document: ${asset.source?.filename}. Industry: ${detectedIndustry}. Summary: ${(asset as any).profile?.summary || ''}`;
                    
                    const chunksCreated = await IngestIndexer.index(
                        rawText,
                        visualFindings,
                        asset as any,
                        fullContext,
                        detectedIndustry,
                        detectedLang,
                        correlationId,
                        workerSession,
                        onProgress,
                        (options as any).metadata?.chunkingLevel || (options as any).chunkingLevel || 'SIMPLE',
                        {}, 
                        options.spacePath
                    );

                    if (rawText && rawText.length > 50 && chunksCreated === 0) {
                        throw new Error(`Pipeline integrity failure: No chunks created for ${rawText.length} chars.`);
                    }

                    // 3. Graph (Optional)
                    if (options.enableGraphRag) {
                        await onProgress(95);
                        await GraphExtractionService.extractAndPersist(
                            rawText,
                            asset.tenantId,
                            correlationId,
                            { sourceDoc: asset.source?.filename || 'unknown' }
                        );
                    }

                    // Final state transition
                    await knowledgeAssetRepository.update(docId, {
                        ingestionStatus: 'COMPLETED',
                        totalChunks: chunksCreated,
                        updatedAt: new Date(),
                    } as any, workerSession);

                    await onProgress(100);

                    return {
                        success: true,
                        status: 'COMPLETED',
                        docId: docId,
                        correlationId,
                        chunks: chunksCreated,
                        language: detectedLang
                    };
                } catch (err: any) {
                    const message = err instanceof Error ? err.message : String(err);
                    // Custom recovery: Mark FAILED in DB
                    try {
                        await knowledgeAssetRepository.update(docId, {
                            ingestionStatus: 'FAILED',
                            error: message,
                            updatedAt: new Date(),
                        } as any, workerSession);
                    } catch (updateErr) {
                        console.error(`[ANALYSIS_FAILED_CRITICAL] Could not set FAILED status for ${docId}:`, updateErr);
                    }
                    throw err; // Re-throw for withCorrelation logging
                }
            }
        );
    }

    /**
     * 🚀 getSpace (Phase 344)
     * Recupera un espacio por ID asegurando aislamiento de tenant.
     */
    static async getSpace(spaceId: string, tenantId: string): Promise<Space | null> {
        return await spaceRepository.findById(spaceId, getSystemSession(tenantId));
    }
}
