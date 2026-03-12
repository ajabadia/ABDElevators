import { IngestPreparer } from './IngestPreparer';
import { IngestAnalyzer } from './IngestAnalyzer';
import { IngestIndexer } from './IngestIndexer';
import { knowledgeAssetRepository } from '@/lib/repositories/KnowledgeAssetRepository';
import { IngestStorageService } from './IngestStorageService';
import { IngestAuditService } from './IngestAuditService';
import { IngestStrategyService } from './IngestStrategyService';
import { GraphExtractionService } from '@/services/core/graph-extraction-service';
import { IngestOptions, IngestResult, EnrichmentOptions } from './types';
import { logEvento } from '@/lib/logger';
import { KnowledgeAsset } from '@/lib/schemas';
import { UserRole } from '@/types/roles';
import { TenantSession } from '@/lib/db-tenant';
import { StateTransitionValidator, IngestState } from './core/StateTransitionValidator';
import { spaceRepository } from '@/lib/repositories/SpaceRepository';
import { Space } from '@/lib/schemas/spaces';

/**
 * 🚀 IngestService: Orchestrator for the Ingestion Pipeline (Phase 110)
 * 
 * Flow: Prepare -> Analyze -> Index
 * Hardened for Era 8: Strict types, central repository, atomic states.
 */
export class IngestService {
    static async ingest(options: IngestOptions): Promise<IngestResult> {
        const correlationId = options.correlationId || crypto.randomUUID();
        const tenantId = (options.metadata as any)?.tenantId || 'platform_master';

        try {
            // 🤖 Autopilot Check (FASE 251)
            const db = await (await import('@/lib/db')).connectDB();
            const config = await db.collection('tenant_configs').findOne({ tenantId });

            if (config?.autoOps?.enabled && config?.autoOps?.lastAction === 'INGEST_PAUSED') {
                await logEvento({
                    level: 'WARN',
                    source: 'INGEST_SERVICE',
                    action: 'INGEST_REJECTED_PAUSED',
                    message: `Ingestion rejected for tenant ${tenantId} due to active safety pause: ${config.autoOps.pauseReason}`,
                    correlationId,
                    tenantId
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
                    message: 'Storage quota exceeded for this tenant.'
                };
            }

            // 1. Prepare
            const preparation = await IngestPreparer.prepare({ ...options, correlationId });
            if (preparation.status === 'DUPLICATE') {
                return {
                    success: true,
                    docId: preparation.docId,
                    status: 'DUPLICATE',
                    correlationId,
                    message: 'Document already exists and is completed'
                };
            }

            // 2. Analyze & Index
            const result = await this.executeAnalysis(preparation.docId, {
                ...options.metadata,
                correlationId,
                userEmail: options.userEmail,
                enableVision: options.enableVision,
                enableTranslation: options.enableTranslation,
                enableGraphRag: options.enableGraphRag,
                enableCognitive: options.enableCognitive,
                enableHierarchicalRag: options.enableHierarchicalRag
            });

            return result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            await logEvento({
                level: 'ERROR',
                source: 'INGEST_SERVICE',
                action: 'INGEST_FAILED',
                message: `Ingestion orchestration failed: ${message}`,
                correlationId,
                details: { error: message, stack: error instanceof Error ? error.stack : undefined }
            });
            throw error;
        }
    }

    static async executeAnalysis(docId: string, options: EnrichmentOptions): Promise<IngestResult> {
        const start = Date.now();
        const asset = await knowledgeAssetRepository.findById(docId);

        if (!asset) throw new Error(`Asset ${docId} not found`);

        const correlationId = options.correlationId || asset.correlationId || crypto.randomUUID();
        const workerSession: TenantSession = {
            user: {
                id: 'system_worker',
                email: options.userEmail || (asset as any).uploadedBy || 'system@abd.com',
                tenantId: asset.tenantId || 'platform_master',
                role: UserRole.ADMIN
            }
        };

        const workerEmail = workerSession.user?.email || 'system@abd.com';

        // Transition FSM
        await StateTransitionValidator.transition(asset.ingestionStatus as IngestState, 'PROCESSING', {
            docId, correlationId, tenantId: asset.tenantId, userId: workerEmail
        });

        await knowledgeAssetRepository.update(docId, {
            $set: {
                ingestionStatus: 'PROCESSING',
                attempts: (asset.attempts || 0) + 1,
                updatedAt: new Date(),
                enableHierarchicalRag: options.enableHierarchicalRag,
                spacePath: options.spacePath // Phase 344
            }
        });

        const updateProgress = async (percent: number) => {
            if (options.job) await options.job.updateProgress(percent);
        };

        try {
            // Retrieve Buffer
            const buffer = await IngestStorageService.getBuffer(asset as any, correlationId);

            // 2. Analyze
            await updateProgress(10);
            const analysis = await IngestAnalyzer.analyze(
                buffer,
                asset as KnowledgeAsset,
                correlationId,
                workerSession,
                options as any
            );

            // 3. Index
            await updateProgress(60);
            const chunksCreated = await IngestIndexer.index(
                analysis.rawText,
                analysis.visualFindings as any,
                asset as any,
                analysis.documentContext,
                analysis.detectedIndustry,
                analysis.detectedLang,
                correlationId,
                workerSession,
                updateProgress,
                asset.chunkingLevel as any,
                {}, // chunkingConfig
                options.spacePath // Phase 344
            );

            // 4. Graph (Optional)
            if (options.enableGraphRag) {
                await updateProgress(95);
                await GraphExtractionService.extractAndPersist(
                    analysis.rawText,
                    asset.tenantId,
                    correlationId,
                    { sourceDoc: asset.filename }
                );
            }

            await updateProgress(100);

            // Final state
            const isRepair = (asset as any).repairPhase && (asset as any).repairPhase !== 'NONE';

            await knowledgeAssetRepository.update(docId, {
                $set: {
                    ingestionStatus: 'COMPLETED',
                    totalChunks: chunksCreated,
                    updatedAt: new Date(),
                    repairPhase: 'NONE',
                    autoRepaired: isRepair ? true : (asset as any).autoRepaired || false
                }
            });

            const duration = Date.now() - start;
            await IngestAuditService.logEvent({
                assetId: docId,
                correlationId,
                tenantId: asset.tenantId,
                action: 'INGEST_COMPLETE',
                status: 'SUCCESS',
                details: { durationMs: duration, chunksCreated }
            }, workerSession);

            return {
                success: true,
                docId,
                status: 'COMPLETED',
                correlationId,
                chunks: chunksCreated,
                language: analysis.detectedLang
            };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);

            await knowledgeAssetRepository.update(docId, {
                $set: { ingestionStatus: 'FAILED', updatedAt: new Date() }
            });

            await IngestAuditService.logEvent({
                assetId: docId,
                correlationId,
                tenantId: asset.tenantId,
                action: 'INGEST_ERROR',
                status: 'ERROR',
                details: { error: message }
            }, workerSession);

            throw error;
        }
    }

    /**
     * Helper to fetch space (Phase 344)
     */
    static async getSpace(spaceId: string, tenantId: string): Promise<Space | null> {
        return await spaceRepository.findById(spaceId, { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
    }
}
