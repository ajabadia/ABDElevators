import { ragQueryLogRepository } from '../repositories/RAGQueryLogRepository';
import { ragEvaluationRepository } from '../repositories/RAGEvaluationRepository';
import { goldenSetRepository } from '../repositories/GoldenSetRepository';
import { type RAGQueryLog, type GoldenSet, type RAGEvaluation } from '../schemas/rag-quality';
import { type TenantSession } from '../db-tenant';
import { EntityId } from '../schemas/common';
import { logEvento } from '../logger';

/**
 * 🎯 RAGQualityService
 * Servicio central para la evaluación de calidad RAG (Era 12 Hardening).
 * Conecta Golden Sets con AssetChunks reales.
 */
export class RAGQualityService {
    /**
     * Registra un log de consulta RAG y opcionalmente lo vincula a un Golden Set.
     */
    static async recordQueryLog(logData: Partial<RAGQueryLog>, session: TenantSession): Promise<EntityId> {
        const logId = await ragQueryLogRepository.create(logData as any, session);

        await logEvento({
            level: 'INFO',
            source: 'RAG_QUALITY_SERVICE',
            action: 'RECORD_QUERY_LOG',
            message: `Registrado log de consulta RAG para tenant ${session.user?.tenantId || 'unknown'}`,
            correlationId: (logData as any).correlationId || 'system',
            details: { logId, query: logData.query }
        });

        return logId;
    }

    /**
     * Evalúa un log de consulta específico contra su Golden Set asociado.
     */
    static async evaluateLog(logId: EntityId, session: TenantSession): Promise<EntityId | null> {
        const log = await ragQueryLogRepository.findById(logId, session);
        if (!log || !log.goldenSetId || !log.goldenSetQueryId) return null;

        const goldenSet = await goldenSetRepository.findById(log.goldenSetId, session);
        if (!goldenSet) return null;

        const goldenQuery = goldenSet.queries.find(q => q.id.toString() === log.goldenSetQueryId?.toString());
        if (!goldenQuery) return null;

        // 🧮 Calcular Métricas de Retrieval
        const expectedIds = new Set(goldenQuery.expectedChunkIds.map(id => id.toString()));
        const retrievedIds = new Set(log.retrievedChunkIds.map(id => id.toString()));

        const intersection = [...retrievedIds].filter(id => expectedIds.has(id));
        const recall = expectedIds.size > 0 ? intersection.length / expectedIds.size : 0;

        const evaluationData: Partial<RAGEvaluation> = {
            tenantId: log.tenantId,
            goldenSetId: log.goldenSetId,
            goldenSetQueryId: log.goldenSetQueryId,
            ragQueryLogId: logId,
            retrievalRecall: recall,
            retrievedIntersectionCount: intersection.length,
            expectedCount: expectedIds.size,
            passed: recall >= (goldenQuery.evaluationCriteria?.minRetrievalRecall || 0.8),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const evalId = await ragEvaluationRepository.create(evaluationData as any, session);

        await logEvento({
            level: 'INFO',
            source: 'RAG_QUALITY_SERVICE',
            action: 'EVALUATE_LOG',
            message: `Evaluación RAG completada: Recall ${Math.round(recall * 100)}%`,
            correlationId: (log as any).correlationId || 'system',
            details: { logId, evalId, recall, passed: evaluationData.passed }
        });

        return evalId;
    }

    /**
     * Proceso batch para evaluar logs pendientes de un tenant.
     */
    static async runBatchEvaluation(tenantId: string, limit: number = 50): Promise<{ processed: number; passed: number }> {
        const session = { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any;

        // Buscar logs que tengan GoldenSet pero NO tengan evaluación previa
        // Nota: Esto requiere una query que checkee la inexistencia de RAGEvaluation para ese logId.
        // Por simplicidad en este sprint, procesaremos logs recientes con goldenSetId.
        const logs = await ragQueryLogRepository.list({
            tenantId,
            goldenSetId: { $exists: true }
        } as any, { limit, sort: { createdAt: -1 } }, session);

        let processed = 0;
        let passed = 0;

        for (const log of logs) {
            const evalId = await this.evaluateLog((log as any)._id, session);
            if (evalId) {
                processed++;
                const evaluation = await ragEvaluationRepository.findById(evalId, session);
                if (evaluation?.passed) passed++;
            }
        }

        return { processed, passed };
    }
}
