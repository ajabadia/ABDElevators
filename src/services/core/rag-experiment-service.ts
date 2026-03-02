import { ragExperimentRepository } from '@/lib/repositories/RagExperimentRepository';
import { logEvento } from '@/lib/logger';
import { RagEvaluationService } from './rag-evaluation-service';
import { RagExperiment } from '@/lib/schemas/rag-experiment';
import { TenantSession } from '@/lib/db-tenant';
import { ClientSession } from 'mongodb';
import crypto from 'crypto';
import { AppError } from '@/lib/errors';

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

            const experiment: Omit<RagExperiment, '_id'> = {
                tenantId,
                userId,
                correlationId,
                query,
                config,
                result: dummyResponse,
                contexts: dummyContexts,
                evaluation: evaluation.metrics as Record<string, number>,
                timestamp: new Date()
            };

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

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            await logEvento({
                level: 'ERROR',
                source: 'RAG_EXPERIMENT',
                action: 'FAILED',
                message,
                correlationId,
                tenantId
            });
            throw new AppError('DATABASE_ERROR', 500, `Experiment execution failed: ${message}`);
        }
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
