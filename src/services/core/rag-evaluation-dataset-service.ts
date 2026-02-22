import { Document, ObjectId } from 'mongodb';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import {
    RagEvaluationDataset,
    RagEvaluationDatasetSchema,
    CreateRagEvaluationDatasetSchema
} from '@/lib/schemas/rag-evaluation';
import { AppError } from '@/lib/errors';

/**
 * RagEvaluationDatasetService
 * Manages datasets for RAG benchmarking and performance tracking.
 */
export class RagEvaluationDatasetService {

    /**
     * Create a new evaluation dataset.
     */
    static async createDataset(session: TenantSession, data: any): Promise<string> {
        const validated = CreateRagEvaluationDatasetSchema.parse(data);
        const collection = await getTenantCollection<Document>('rag_evaluation_datasets', session);

        const dataset: RagEvaluationDataset = {
            ...validated,
            tenantId: session.user?.tenantId || 'platform_master',
            createdAt: new Date(),
            updatedAt: new Date(),
            active: true
        } as any;

        const result = await collection.insertOne(dataset as any);

        await logEvento({
            level: 'INFO',
            source: 'RAG_EVAL_SERVICE',
            action: 'DATASET_CREATED',
            message: `New evaluation dataset created: ${validated.name}`,
            tenantId: session.user?.tenantId,
            correlationId: `rag-eval-create-${Date.now()}`,
            details: { datasetId: result.insertedId.toString(), testCount: validated.testCases.length }
        });

        return result.insertedId.toString();
    }

    /**
     * Get a dataset by ID.
     */
    static async getDataset(session: TenantSession, datasetId: string): Promise<RagEvaluationDataset> {
        const collection = await getTenantCollection<Document>('rag_evaluation_datasets', session);
        const doc = await collection.findOne({ _id: new ObjectId(datasetId) });

        if (!doc) {
            throw new AppError('NOT_FOUND', 404, 'Dataset de evaluación no encontrado');
        }

        return RagEvaluationDatasetSchema.parse(doc);
    }

    /**
     * List datasets for a tenant.
     */
    static async listDatasets(session: TenantSession): Promise<RagEvaluationDataset[]> {
        const collection = await getTenantCollection<RagEvaluationDataset>('rag_evaluation_datasets', session);
        return collection.find({});
    }

    /**
     * Update test cases results after an evaluation run.
     */
    static async updateTestResults(
        session: TenantSession,
        datasetId: string,
        results: Record<string, any>
    ): Promise<void> {
        const collection = await getTenantCollection<Document>('rag_evaluation_datasets', session);

        const dataset = await this.getDataset(session, datasetId);

        const updatedTestCases = dataset.testCases.map(tc => {
            if (results[tc.id]) {
                return {
                    ...tc,
                    lastEvaluation: {
                        ...results[tc.id],
                        evaluatedAt: new Date()
                    }
                };
            }
            return tc;
        });

        await collection.updateOne(
            { _id: new ObjectId(datasetId) },
            {
                $set: {
                    testCases: updatedTestCases,
                    updatedAt: new Date()
                }
            }
        );

        await logEvento({
            level: 'INFO',
            source: 'RAG_EVAL_SERVICE',
            action: 'RUN_RESULTS_UPDATED',
            message: `Evaluation results updated for dataset ${dataset.name}`,
            tenantId: session.user?.tenantId,
            correlationId: `rag-eval-upd-${Date.now()}`,
            details: { datasetId }
        });
    }
}
