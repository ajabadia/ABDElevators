import { Entity, IndustryType, GenericCaseSchema, TenantIdSchema, RiskFinding } from '@/lib/schemas';
import { orderRepository } from '@/lib/repositories/OrderRepository';
import { type SafeFilter } from '@/lib/repositories/BaseRepository';
import { RagService } from '@/services/core/RagService';
import { RiskService } from '@/services/security/RiskService';
import { FederatedKnowledgeService } from '@/services/core/FederatedKnowledgeService';
import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { PIIMasker } from '@/services/security/pii-masker';
import { PromptService } from '@/services/llm/prompt-service';
import { AIMODELIDS } from '@/lib/ai-models';
import { getTenantCollection, type TenantSession } from '@/lib/db-tenant';
import { PDFIngestionPipeline } from '@/services/infra/pdf/PDFIngestionPipeline';
import { mapEntityToCase } from '@/lib/mappers';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';

const DetectedPatternSchema = z.object({
    type: z.string(),
    model: z.string()
});

/**
 * 🏢 TechnicalEntityService
 * Orchestrates the analysis of technical entities.
 * Standardized for Era 8 (Zero any, explicit types, resilient parsing).
 */
export class TechnicalEntityService {
    /**
     * Performs a full RAG analysis of an entity text
     */
    static async performFullAnalysis(
        entityText: string,
        filename: string,
        tenantId: string,
        industry: IndustryType,
        correlationId: string,
        fileMd5: string
    ) {
        const { logEvento } = await import('@/lib/logger');
        const start = Date.now();

        await logEvento({
            level: 'INFO',
            source: 'TECHNICAL_ENTITY_SERVICE',
            action: 'ANALYSIS_START',
            message: `Starting analysis for file: ${filename}`,
            correlationId,
            tenantId,
            details: { filename, industry, fileMd5 }
        });

        // 🛡️ Rule #13: PII Masking (Era 12 Data Protection)
        const { maskedText: sanitizedText, metadata: piiMetadata } = await PIIMasker.mask(entityText, tenantId, correlationId);

        try {
            // 1. AI: Extract detected patterns (Prompt Governance Skill)
            // Rule #12: Prompt Governance - Use PromptRunner.runJson
            const detectedPatterns = await PromptRunner.runJson({
                key: 'TECHNICALENTITY_PATTERNS',
                variables: { context: sanitizedText },
                schema: z.array(DetectedPatternSchema),
                tenantId,
                correlationId,
                industry,
                task: 'TECHNICAL_ANALYSIS'
            });

            await logEvento({
                level: 'DEBUG',
                source: 'TECHNICAL_ENTITY_SERVICE',
                action: 'PATTERNS_EXTRACTED',
                message: `Extracted ${detectedPatterns.length} patterns from text`,
                correlationId,
                tenantId,
                details: { 
                    count: detectedPatterns.length,
                    piiMetadata 
                }
            });

            // 2. RAG: For each pattern, search relevant context (Unified search entry point)
            const resultsWithContext = await Promise.all(
                detectedPatterns.map(async (m) => {
                    const query = `${m.type} model ${m.model}`;
                    const context = await RagService.search(query, TenantIdSchema.parse(tenantId), correlationId, industry, { limit: 2, type: 'TECHNICAL' });
                    return {
                        ...m,
                        ragContext: context
                    };
                })
            );

            // 3. Federated Discovery
            const federatedInsights = await FederatedKnowledgeService.searchGlobalPatterns(
                detectedPatterns.map((m: { type: string, model: string }) => `${m.type} ${m.model}`).join(' '),
                tenantId,
                correlationId,
                3
            );

            // 4. Risk Detection
            const consolidatedContext = resultsWithContext
                .map(r => `Component ${r.model}: ${r.ragContext.map((c) => c.text).join(' ')}`)
                .join('\n');

            const detectedRisks = await RiskService.analyzeRisks(
                sanitizedText,
                consolidatedContext,
                industry,
                tenantId,
                correlationId
            );

            const duration = Date.now() - start;
            
            // 📊 RAG Quality Telemetry (Phase 255.4)
            const hitRate = resultsWithContext.filter((r) => r.ragContext.length > 0).length / (detectedPatterns.length || 1);

            await logEvento({
                level: 'INFO',
                source: 'TECHNICAL_ENTITY_SERVICE',
                action: 'ANALYSIS_COMPLETE',
                message: `Analysis completed successfully in ${duration}ms`,
                correlationId,
                tenantId,
                details: {
                    duration_ms: duration,
                    patternsCount: detectedPatterns.length,
                    risksCount: detectedRisks.length,
                    ragQuality: {
                        hitRate,
                        avgContextPerPattern: resultsWithContext.reduce((acc: number, curr) => acc + (curr.ragContext?.length || 0), 0) / (detectedPatterns.length || 1)
                    }
                }
            });

            return {
                resultsWithContext,
                detectedRisks,
                federatedInsights,
                patternsForStorage: resultsWithContext.map((r) => ({
                    type: r.type,
                    model: r.model
                }))
            };
        } catch (error: unknown) {
            await logEvento({
                level: 'ERROR',
                source: 'TECHNICAL_ENTITY_SERVICE',
                action: 'ANALYSIS_ERROR',
                message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                correlationId,
                tenantId,
                details: { error: error instanceof Error ? error.message : String(error) }
            });
            throw error;
        }
    }

    /**
     * Checks if an entity already exists (Deduplication)
     */
    static async findExistingByHash(md5Hash: string, tenantId: string): Promise<Entity | null> {
        return await orderRepository.findByHash(md5Hash, tenantId);
    }

    /**
     * Orchestrates the complete analysis process from extraction to persistence and sync.
     * Consolidation for Era 12 (Phase 3).
     */
    static async processEntityAnalysis(
        params: {
            entityId: string,
            fileBuffer?: string, // base64
            filename: string,
            tenantId: string,
            industry: IndustryType,
            correlationId: string,
            fileMd5?: string,
            entityText?: string
        },
        onProgress?: (progress: AnalysisProgress) => Promise<void>
    ) {
        const { entityId, fileBuffer, filename, tenantId, industry, correlationId, fileMd5, entityText } = params;
        const start = Date.now();

        try {
            if (onProgress) {
                await onProgress({
                    phase: 'RUNNING',
                    step: 'PDF_EXTRACTION',
                    status: 'info',
                    message: 'Iniciando procesamiento y extracción de documento...',
                    progress: 10
                });
            }

            // 1. Extraction (if buffer provided)
            let text = entityText || '';
            if (fileBuffer && !text) {
                const buffer = Buffer.from(fileBuffer, 'base64');
                const pipelineResult = await PDFIngestionPipeline.runPipeline(buffer, {
                    tenantId,
                    correlationId,
                    industry,
                    strategy: 'ADVANCED',
                    pii: { enabled: true }
                });
                text = pipelineResult.maskedText || pipelineResult.cleanedText;
            }

            if (onProgress) {
                await onProgress({
                    phase: 'RUNNING',
                    step: 'RAG_SEARCH',
                    status: 'info',
                    message: 'Extrayendo patrones y buscando contexto técnico...',
                    progress: 40
                });
            }

            // 2. Full Analysis (Patterns, RAG, Federated, Risks)
            const analysisResults = await this.performFullAnalysis(
                text,
                filename,
                tenantId,
                industry,
                correlationId,
                fileMd5 || ''
            );

            if (onProgress) {
                await onProgress({
                    phase: 'RUNNING',
                    step: 'PERSISTENCE',
                    status: 'info',
                    message: 'Persistiendo resultados y sincronizando casos...',
                    progress: 90
                });
            }

            // 3. Persistence in entities/orders
            const mockSession = { user: { tenantId } } as unknown as TenantSession;
            const entitiesCollection = await getTenantCollection<Entity>('orders', mockSession);
            const updateData = {
                originalText: text,
                detectedPatterns: analysisResults.patternsForStorage,
                ragContextFull: analysisResults.resultsWithContext,
                metadata: { 
                    risks: analysisResults.detectedRisks, 
                    federatedInsights: analysisResults.federatedInsights 
                },
                status: 'analyzed',
                updatedAt: new Date()
            };

            await entitiesCollection.updateOne(
                { _id: new ObjectId(entityId) } as SafeFilter<Entity>,
                { $set: updateData }
            );

            // 4. Syncing to Cases
            const entityDoc = await entitiesCollection.findOne({ _id: new ObjectId(entityId) } as SafeFilter<Entity>);
            if (entityDoc) {
                await this.syncGenericCase(entityId, entityDoc, analysisResults.detectedRisks, tenantId, correlationId);
            }

            if (onProgress) {
                await onProgress({
                    phase: 'COMPLETED',
                    step: 'IDLE',
                    status: 'success',
                    message: 'Análisis técnico completado exitosamente.',
                    progress: 100
                });
            }

            return {
                success: true,
                entityId,
                risksCount: analysisResults.detectedRisks.length,
                durationMs: Date.now() - start
            };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            
            if (onProgress) {
                await onProgress({
                    phase: 'FAILED',
                    step: 'IDLE',
                    status: 'error',
                    message: `Error en análisis: ${message}`,
                    progress: 0
                });
            }

            const entitiesCollection = await getTenantCollection<Entity>('orders', { user: { tenantId } } as TenantSession, 'MAIN');
            await entitiesCollection.updateOne(
                { _id: new ObjectId(entityId) as any, tenantId } as SafeFilter<Entity>,
                { $set: { status: 'error', lastError: message } }
            );

            throw error;
        }
    }

    /**
     * Private helper for case synchronization
     */
    private static async syncGenericCase(entityId: string, entityDoc: Entity, detectedRisks: RiskFinding[], tenantId: string, correlationId: string) {
        try {
            const caseCollection = await getTenantCollection('cases', { user: { tenantId } } as TenantSession, 'MAIN');
            const genericCase = mapEntityToCase(entityDoc, tenantId);
            genericCase.metadata = {
                ...genericCase.metadata,
                risks: detectedRisks
            };

            const validatedCase = GenericCaseSchema.parse(genericCase);
            await caseCollection.updateOne(
                { 'metadata.sourceId': entityId },
                { $set: validatedCase },
                { upsert: true }
            );
        } catch (error: unknown) {
            await logEvento({
                level: 'ERROR',
                source: 'TECHNICAL_ENTITY_SERVICE',
                action: 'CASE_SYNC_FAILED',
                message: `Failed to sync generic case for entity ${entityId}`,
                correlationId,
                tenantId,
                details: { error: error instanceof Error ? error.message : String(error) }
            });
        }
    }
}

/**
 * 📊 SSE Progress Format (Era 12)
 */
export interface AnalysisProgress {
    phase: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    step: 'PDF_EXTRACTION' | 'RAG_SEARCH' | 'FEDERATED_DISCOVERY' | 'RISK_ANALYSIS' | 'PERSISTENCE' | 'IDLE';
    status: 'info' | 'success' | 'error';
    message: string;
    progress: number;
}
