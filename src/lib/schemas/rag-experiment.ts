import { z } from 'zod';

export const RagExperimentSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    userId: z.string(),
    correlationId: z.string(),
    query: z.string(),
    config: z.object({
        model: z.string(),
        temperature: z.number().optional(),
        promptKey: z.string(),
        chunkSize: z.number().optional(),
        chunkOverlap: z.number().optional(),
        topK: z.number().optional(),
    }),
    result: z.string(),
    contexts: z.array(z.string()),
    evaluation: z.record(z.string(), z.number()).optional(),
    timestamp: z.date().default(() => new Date()),
});

export type RagExperiment = z.infer<typeof RagExperimentSchema>;
