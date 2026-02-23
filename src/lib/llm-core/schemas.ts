import { z } from 'zod';

/**
 * ⚖️ RAG Judge Output Schema
 * Exact structure returned by the RAG_JUDGE prompt.
 */
export const RagJudgeOutputSchema = z.object({
    faithfulness: z.number().min(0).max(1),
    answer_relevance: z.number().min(0).max(1),
    context_precision: z.number().min(0).max(1),
    reasoning: z.string(),
    causal_analysis: z.object({
        cause_id: z.string(),
        fix_strategy: z.string()
    }).optional()
});

export type RagJudgeOutput = z.infer<typeof RagJudgeOutputSchema>;

/**
 * 🛠️ Causal Analysis Schema
 */
export const CausalAnalysisSchema = z.object({
    cause_id: z.string(),
    fix_strategy: z.string()
});
