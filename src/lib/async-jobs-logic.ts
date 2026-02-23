import { PDFIngestionPipeline } from '@/services/infra/pdf/PDFIngestionPipeline';
import { analyzeEntityWithGemini } from './llm';
import { performTechnicalSearch } from './rag-service';
import { RiskService } from './risk-service';
import { getTenantCollection } from './db-tenant';
import { EntitySchema, GenericCaseSchema } from './schemas';
import { mapEntityToCase } from './mappers';
import { logEvento } from './logger';
import { ObjectId } from 'mongodb';
import { FederatedKnowledgeService } from './federated-knowledge-service';

/**
 * Lógica de procesamiento para trabajos asíncronos (Fase 31: BullMQ).
 * Esta lógica se separa para poder ser testeada y llamada desde el Worker.
 */
export class AsyncJobsLogic {

    /**
     * Procesa el análisis de un PDF.
     */
    static async processPdfAnalysis(jobData: any, jobId: string, updateProgress: (p: number) => Promise<void>) {
        const { tenantId, userId, data, correlationId = jobId } = jobData;
        const { entityId, fileBuffer, filename, industry = 'GENERIC' } = data;

        try {
            await logEvento({
                level: 'INFO',
                source: 'ASYNC_LOGIC',
                action: 'PDF_ANALYSIS_START',
                message: `Iniciando análisis asíncrono para ${filename}`,
                correlationId,
                tenantId
            });

            await updateProgress(10);

            // 1. Extraer Texto via Pipeline (Phase 8.2)
            const buffer = Buffer.from(fileBuffer, 'base64');
            const pipelineResult = await PDFIngestionPipeline.runPipeline(buffer, {
                tenantId,
                correlationId,
                industry: industry as any,
                strategy: 'ADVANCED',
                pii: { enabled: true }
            });
            const text = pipelineResult.maskedText || pipelineResult.cleanedText;
            await updateProgress(30);

            // 2. Análisis IA (Componentes/Patrones)
            const detectedPatterns = await analyzeEntityWithGemini('pedido', text, tenantId, correlationId);
            await updateProgress(50);

            const resultsWithContext = await Promise.all(
                detectedPatterns.map(async (m: { type: string; model: string }) => {
                    const query = `${m.type} model ${m.model}`;
                    const context = await performTechnicalSearch(query, tenantId, correlationId, 2);
                    return {
                        ...m,
                        ragContext: context
                    };
                })
            );

            // --- VISION 2027: Federated Discovery ---
            const federatedInsights = await FederatedKnowledgeService.searchGlobalPatterns(
                detectedPatterns.map((m: any) => `${m.type} ${m.model}`).join(' '),
                tenantId,
                correlationId,
                3
            );

            await updateProgress(70);

            // 4. Análisis de Riesgos
            const consolidatedContext = resultsWithContext
                .map(r => `Component ${r.model}: ${r.ragContext.map((c: any) => c.text).join(' ')}`)
                .join('\n');

            const detectedRisks = await RiskService.analyzeRisks(
                text,
                consolidatedContext,
                industry,
                tenantId,
                correlationId
            );
            await updateProgress(90);

            // 5. Guardar resultados y actualizar estado
            const entitiesCollection = await getTenantCollection('entities', { user: { tenantId } } as any);

            const updateData = {
                originalText: text,
                detectedPatterns: resultsWithContext.map(r => ({
                    type: r.type,
                    model: r.model
                })),
                ragContextFull: resultsWithContext,
                metadata: {
                    risks: detectedRisks,
                    federatedInsights: federatedInsights
                },
                status: 'analyzed',
                updatedAt: new Date()
            };

            await entitiesCollection.updateOne(
                { _id: new ObjectId(entityId) },
                { $set: updateData }
            );

            // 6. Sincronizar con Generic Cases (Visión 2.0)
            try {
                const caseCollection = await getTenantCollection('cases');
                const entityDoc = await entitiesCollection.findOne({ _id: new ObjectId(entityId) });

                if (entityDoc) {
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
                }
            } catch (caseErr) {
                console.error("[AsyncJobsLogic] Error syncing generic case:", caseErr);
            }

            await updateProgress(100);

            await logEvento({
                level: 'INFO',
                source: 'ASYNC_LOGIC',
                action: 'PDF_ANALYSIS_SUCCESS',
                message: `Análisis asíncrono completado para ${filename}`,
                correlationId,
                tenantId
            });

            return { success: true, entityId, risksCount: detectedRisks.length };

        } catch (error: any) {
            console.error(`[AsyncJobsLogic] Fatal error in PDF Analysis:`, error);

            const entitiesCollection = await getTenantCollection('entities', { user: { tenantId } } as any);
            await entitiesCollection.updateOne(
                { _id: new ObjectId(entityId) },
                { $set: { status: 'error', lastError: error.message } }
            );

            throw error;
        }
    }
}
