import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema } from './common';

export const RagExperimentSchema = z.object({
    _id: EntityIdSchema.optional(),
    tenantId: TenantIdSchema,
    userId: EntityIdSchema,
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
