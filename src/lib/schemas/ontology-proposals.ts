import { z } from 'zod';
import { TenantIdSchema, EntityIdSchema } from './core';

/**
 * 🏛️ ERA 16: ONTOLOGY EVOLUTION GOVERNANCE
 * Records refinement proposals for human-in-the-loop audit.
 */

export const OntologyProposalStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'ROLLED_BACK']);
export type OntologyProposalStatus = z.infer<typeof OntologyProposalStatusSchema>;

export const OntologyProposalSchema = z.object({
    _id: z.any().optional(),
    tenantId: TenantIdSchema,
    correlationId: z.string(),
    
    // State of the world when proposals were generated
    snapshots: z.object({
        taxonomies: z.array(z.any()),
        drift: z.array(z.any())
    }),
    
    // Governance reference
    promptKey: z.string(),
    promptVersion: z.number(),
    
    proposals: z.array(z.object({
        action: z.enum(['UPDATE', 'CREATE', 'MERGE', 'DELETE']),
        targetKey: z.string(),
        newName: z.string().optional(),
        newDescription: z.string().optional(),
        confidence: z.number(),
        reasoning: z.string()
    })),
    
    status: OntologyProposalStatusSchema.default('PENDING'),
    
    // Feedback loop
    reviewedBy: z.string().optional(),
    reviewedAt: z.date().optional(),
    rejectionReason: z.string().optional(),
    
    appliedAt: z.date().optional(),
    appliedBy: z.string().optional(),
    
    createdAt: z.date().default(() => new Date()),
});

export type OntologyProposal = z.infer<typeof OntologyProposalSchema>;
