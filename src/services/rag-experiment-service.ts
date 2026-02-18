import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import { RagEvaluationService } from './rag-evaluation-service';
import crypto from 'crypto';

export interface RagExperimentConfig {
    model: string;
    temperature?: number;
    promptKey: string;
    chunkSize?: number;
    chunkOverlap?: number;
    topK?: number;
}

export class RagExperimentService {
    /**
     * Executes a RAG Experiment
     */
    static async runExperiment(
        tenantId: string,
        query: string,
        config: RagExperimentConfig,
        userId: string
    ): Promise<any> {
        const correlationId = `exp_${crypto.randomBytes(8).toString('hex')}`;

        try {
            await logEvento({
                level: 'INFO',
                source: 'RAG_EXPERIMENT',
                action: 'START',
                message: `Starting RAG Experiment: ${config.model}`,
                correlationId,
                tenantId,
                details: config
            });

            // 1. Simular ejecución de RAG (Aquí se integraría con el motor RAG real)
            // Por ahora usamos el EvaluationService para simular el ciclo completo
            // TODO: Integrar con RagService.query() real cuando esté optimizado

            const dummyContexts = [
                "Fragmento de prueba 1 sobre ascensores...",
                "Manual técnico sección 4.2: Mantenimiento preventivo."
            ];
            const dummyResponse = "Respuesta generada por el experimento para la query: " + query;

            const evaluation = await RagEvaluationService.evaluateQuery(
                correlationId,
                query,
                dummyResponse,
                dummyContexts,
                tenantId
            );

            const experiment = {
                tenantId,
                userId,
                correlationId,
                query,
                config,
                result: dummyResponse,
                contexts: dummyContexts,
                evaluation: evaluation.metrics,
                timestamp: new Date()
            };

            const db = await connectDB();
            await db.collection('rag_experiments').insertOne(experiment);

            return experiment;

        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source: 'RAG_EXPERIMENT',
                action: 'FAILED',
                message: error instanceof Error ? error.message : 'Unknown error',
                correlationId,
                tenantId
            });
            throw error;
        }
    }

    /**
     * Lists recent experiments
     */
    static async listExperiments(tenantId: string, limit = 10): Promise<any[]> {
        const db = await connectDB();
        return await db.collection('rag_experiments')
            .find({ tenantId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    }
}
