import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { PROMPTS } from '@/lib/prompts';
import { callGeminiMini } from '@/services/llm/llm-service';
import { TaxonomyService } from '@/services/core/taxonomy-service';
import { AppError } from '@/lib/errors';
import { PromptService } from '@/services/llm/prompt-service';
import { z } from 'zod';

const RefinementProposalSchema = z.object({
    proposals: z.array(z.object({
        action: z.enum(['UPDATE', 'CREATE', 'MERGE']),
        targetKey: z.string(),
        newName: z.string().optional(),
        newDescription: z.string().optional(),
        confidence: z.number().min(0).max(1),
        reasoning: z.string()
    }))
});

export type RefinementProposal = z.infer<typeof RefinementProposalSchema>['proposals'][0];

/**
 * ⚡ SovereignOntologyService (Vision 2027+)
 * Enables autonomous evolution of the system ontology based on human feedback loop.
 */
export class SovereignOntologyService {
    private static readonly DRIFT_THRESHOLD = 5; // Minimum corrections to trigger refinement

    /**
     * Analyzes corrections in FeedbackService to identify "drift".
     */
    static async analyzeFeedbackDrift(tenantId: string, windowDays: number = 7): Promise<Record<string, any>[]> {
        const collection = await getTenantCollection('ai_human_feedback');
        const since = new Date();
        since.setDate(since.getDate() - windowDays);

        // Aggregate recurrent corrections (modelSuggestion !== humanDecision)
        const aggregation = collection.aggregate([
            {
                $match: {
                    tenantId,
                    createdAt: { $gte: since },
                    $expr: { $ne: ["$modelSuggestion", "$humanDecision"] }
                }
            },
            {
                $group: {
                    _id: {
                        original: "$modelSuggestion",
                        corrected: "$humanDecision",
                        category: "$category"
                    },
                    count: { $sum: 1 },
                    examples: { $push: "$correction" }
                }
            },
            { $match: { count: { $gte: this.DRIFT_THRESHOLD } } },
            { $sort: { count: -1 } }
        ]);

        return await aggregation.toArray();
    }

    /**
     * Generates ontology refinement proposals using LLM.
     */
    static async generateProposals(tenantId: string, correlationId: string): Promise<RefinementProposal[]> {
        const drift = await this.analyzeFeedbackDrift(tenantId);

        if (drift.length === 0) {
            return [];
        }

        const taxonomies = await TaxonomyService.getTaxonomies(tenantId, 'ELEVATORS');
        const taxArray = taxonomies; 

        // Resolve steering for ontology refinement
        const steering = await PromptService.resolveSteering(tenantId, 'ONTOLOGY_REFINEMENT');
        const promptKey = steering?.activePromptKey || 'ONTOLOGY_REFINER';
        const promptVersion = steering?.activePromptVersion;

        const { text: promptText, model: modelId, version: resolvedVersion } = await PromptService.getRenderedPrompt(
            promptKey,
            {
                currentTaxonomies: JSON.stringify(taxArray.map(t => ({ key: t.key, name: t.name, desc: t.description }))),
                feedbackDrift: JSON.stringify(drift.map(d => ({
                    from: d._id.original,
                    to: d._id.corrected,
                    category: d._id.category,
                    frequency: d.count,
                    notes: d.examples.slice(0, 3)
                })))
            },
            tenantId,
            'PRODUCTION',
            'ELEVATORS',
            undefined,
            'ONTOLOGY_REFINEMENT'
        );

        const response = await callGeminiMini(promptText, tenantId, { correlationId, temperature: 0.2 });

        try {
            // Clean potential markdown from LLM
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = RefinementProposalSchema.parse(JSON.parse(cleanJson));

            // Persist proposal for human review
            const proposalsCollection = await getTenantCollection('ontology_proposals');
            await proposalsCollection.insertOne({
                tenantId,
                correlationId,
                snapshots: {
                    taxonomies: taxArray,
                    drift
                },
                promptRef: {
                    key: promptKey,
                    version: resolvedVersion
                },
                proposals: parsed.proposals,
                status: 'PENDING',
                createdAt: new Date()
            });

            await logEvento({
                level: 'INFO',
                source: 'SOVEREIGN_ENGINE',
                action: 'PROPOSALS_GENERATED',
                message: `Generated ${parsed.proposals.length} refinement proposals for tenant ${tenantId}. Stored for review.`,
                correlationId,
                details: { proposalsCount: parsed.proposals.length, promptKey, promptVersion: resolvedVersion }
            });

            return parsed.proposals;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new AppError('INTERNAL_ERROR', 500, `Error processing Sovereign Engine proposals: ${errorMessage}`);
        }
    }

    /**
     * Applies refinements according to steering mode.
     */
    static async applyAutonomousRefinements(tenantId: string, correlationId: string) {
        const steering = await PromptService.resolveSteering(tenantId, 'ONTOLOGY_REFINEMENT');
        
        // If no steering or mode is not PROD/AUTO, we don't apply automatically
        // In this implementation, PROD mode with high confidence = AUTO
        if (steering?.mode !== 'PROD') {
            await logEvento({
                level: 'INFO',
                source: 'SOVEREIGN_ENGINE',
                action: 'SKIP_AUTONOMOUS',
                message: `Skipping autonomous refinement for tenant ${tenantId}. Steering mode is ${steering?.mode || 'NOT_CONFIGURED'}`,
                correlationId,
                tenantId
            });
            return { applied: 0 };
        }

        const proposals = await this.generateProposals(tenantId, correlationId);
        const highConfidence = proposals.filter(p => p.confidence >= 0.9);

        if (highConfidence.length === 0) return { applied: 0 };

        for (const proposal of highConfidence) {
            await logEvento({
                level: 'WARN',
                source: 'SOVEREIGN_ENGINE',
                action: 'AUTONOMOUS_UPDATE',
                message: `Applying autonomous update: ${proposal.targetKey} -> ${proposal.newName}`,
                correlationId,
                details: proposal
            });

            await TaxonomyService.batchUpdateTaxonomies([{
                targetKey: proposal.targetKey,
                newName: proposal.newName || proposal.targetKey,
                newDescription: proposal.newDescription,
                action: proposal.action as any
            }], tenantId, correlationId);
        }

        return { applied: highConfidence.length };
    }
}
