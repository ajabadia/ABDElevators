import { ragExperimentRepository } from '@/lib/repositories/RagExperimentRepository';
import { RagEvaluationService } from './rag-evaluation-service';
import { RagExperiment } from '@/lib/schemas/rag-experiment';
import { TenantSession } from '@/lib/db-tenant';
import { ClientSession } from 'mongodb';
import { AppError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';
import { TenantIdSchema, EntityIdSchema } from '@abd/platform-core';

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
        userId: string,
        session?: TenantSession | null
    ): Promise<RagExperiment> {
        return await withCorrelation(
            { level: 'INFO', source: 'RAG_EXPERIMENT', action: 'START', tenantId, details: config as any },
            async ({ log, correlationId }) => {
                const tId = TenantIdSchema.parse(tenantId);
                const cId = EntityIdSchema.parse(correlationId);
                const uId = EntityIdSchema.parse(userId);

                // 1. Simular ejecución de RAG
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

                const experiment: RagExperiment = {
                    tenantId: tId,
                    userId: uId,
                    correlationId: cId as any,
                    query,
                    config,
                    result: dummyResponse,
                    contexts: dummyContexts,
                    evaluation: evaluation.metrics as Record<string, number>,
                    timestamp: new Date()
                } as any;

                // Transactional integrity
                const { connectDB } = await import('@/lib/db');
                const db = await connectDB();
                const client = (db as unknown as { client: { startSession: () => ClientSession } }).client;
                const mongoSession = client.startSession();

                try {
                    await mongoSession.withTransaction(async () => {
                        await ragExperimentRepository.create(experiment, session, mongoSession);
                    });
                } finally {
                    await mongoSession.endSession();
                }

                return { ...experiment, _id: 'generated' } as RagExperiment;
            }
        );
    }

    /**
     * Lists recent experiments
     */
    static async listExperiments(tenantId: string, session?: TenantSession | null, limit = 10): Promise<RagExperiment[]> {
        return await ragExperimentRepository.list({ tenantId }, {
            sort: { timestamp: -1 },
            limit
        }, session);
    }
}
