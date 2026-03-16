import { z } from "zod";

/**
 * 🛡️ RagGovernanceMetaSchema
 * Metadata to be attached to every RAG evaluation for traceability.
 */
export const RagGovernanceMetaSchema = z.object({
    promptKey: z.string().optional(),
    promptVersion: z.number().optional(),
    modelId: z.string().optional(),
    isShadow: z.boolean().default(false),
    correlationId: z.string().optional(),
    task: z.string().optional(),
});

export type RagGovernanceMeta = z.infer<typeof RagGovernanceMetaSchema>;
