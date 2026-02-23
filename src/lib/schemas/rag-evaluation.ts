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

// RagEvaluation removed - imported from knowledge.ts (bridge to rag-engine)

