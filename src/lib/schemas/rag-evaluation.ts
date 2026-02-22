import { z } from 'zod';
// Decoupled from mongodb to prevent client bundle leaks (Phase 184 Fix)

/**
 * RAG Evaluation Test Case
 */
export const RagEvaluationTestCaseSchema = z.object({
    id: z.string(),
    query: z.string().min(1),
    expectedResponse: z.string().optional(),
    referenceContexts: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),

    // Evaluation Results (History)
    lastEvaluation: z.object({
        status: z.enum(['PASS', 'FAIL', 'PENDING']),
        score: z.number().min(0).max(1),
        reasoning: z.string().optional(),
        evaluatedAt: z.date().optional()
    }).optional()
});

export type RagEvaluationTestCase = z.infer<typeof RagEvaluationTestCaseSchema>;

/**
 * RAG Evaluation Dataset
 */
export const RagEvaluationDatasetSchema = z.object({
    _id: z.any().optional(), // ObjectId serialized as string on client, object on server
    tenantId: z.string(),
    name: z.string().min(3),
    description: z.string().optional(),
    version: z.number().default(1),
    testCases: z.array(RagEvaluationTestCaseSchema),

    active: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date())
});

export type RagEvaluationDataset = z.infer<typeof RagEvaluationDatasetSchema>;

export const CreateRagEvaluationDatasetSchema = RagEvaluationDatasetSchema.omit({
    _id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true
});

/**
 * 🧪 Esquema para Evaluación de Calidad RAG
 */
export const RagEvaluationSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    correlationId: z.string().uuid(),
    query: z.string(),
    generation: z.string(),
    context: z.array(z.string()),
    metrics: z.object({
        faithfulness: z.number().optional(),
        answer_relevance: z.number().optional(),
        context_precision: z.number().optional(),
        context_recall: z.number().optional(),
    }),
    cost: z.number().optional(),
    timestamp: z.date().default(() => new Date()),
});

export type RagEvaluation = z.infer<typeof RagEvaluationSchema>;
