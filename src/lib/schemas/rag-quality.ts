import { z } from "zod";
import { EntityIdSchema, TenantScopedSchema } from "./common";

/**
 * ⚠️ LEGACY GOLDEN SET SCHEMA (Relational Bridge)
 * @deprecated Use `RagGoldenSetSchema` from `knowledge.ts` for all new operational logic.
 * Phase 310/Era 12: Standardized test sets for RAG benchmarks (Local Bridge).
 * This schema is kept for compatibility with historical datasets.
 */
export const GoldenSetQuerySchema = z.object({
    id: EntityIdSchema,                 // sub-id for each query
    question: z.string(),
    questionVariants: z.array(z.string()).default([]),

    // Ground truth: which chunks should be retrieved
    expectedChunkIds: z.array(EntityIdSchema),

    // Ideal answer for evaluating generation
    idealAnswer: z.string().optional(),

    evaluationCriteria: z.object({
        minRetrievalRecall: z.number().min(0).max(1).default(0.8),
        minAnswerFaithfulness: z.number().min(0).max(1).default(0.9),
        requiredEntities: z.array(z.string()).default([]),
        forbiddenEntities: z.array(z.string()).default([])
    }).default({
        minRetrievalRecall: 0.8,
        minAnswerFaithfulness: 0.9,
        requiredEntities: [],
        forbiddenEntities: []
    })
});

export const GoldenSetSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    slug: z.string(),

    // Optional Scope: Space or Type
    spaceId: EntityIdSchema.optional(),
    documentTypeId: EntityIdSchema.optional(),

    queries: z.array(GoldenSetQuerySchema)
})
    .merge(TenantScopedSchema);

export type GoldenSet = z.infer<typeof GoldenSetSchema>;
export type GoldenSetQuery = z.infer<typeof GoldenSetQuerySchema>;

/**
 * 🧪 RAG QUALITY SCHEMAS (Era 13 Unified)
 * Re-exporting from rag-engine to ensure monorepo consistency
 * where applicable, but keeping local bridges for persistence.
 */
export {
    RagGoldenSetSchema,
    RagEvaluationSchema,
    RagOfflineExperimentSchema,
    RagOfflineExperimentResultSchema
} from './knowledge';
