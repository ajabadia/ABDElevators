import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';
import { PROMPTS } from '@/lib/prompts';
import { callGeminiMini } from '@/services/llm/llm-service';
import { TaxonomyService } from '@/services/core/taxonomy-service';
import { AppError } from '@/lib/errors';
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
    static async analyzeFeedbackDrift(tenantId: string, windowDays: number = 7): Promise<any[]> {
        const collection = await getTenantCollection('ai_human_feedback');
        const since = new Date();
        since.setDate(since.getDate() - windowDays);

        // Agregamos correcciones recurrentes (modelSuggestion !== humanDecision)
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

        return await (aggregation as any).toArray();
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
        const taxArray = taxonomies; // Removed redundant await for non-promise array 🛡️🛡️🛡️

        const prompt = (PROMPTS.ONTOLOGY_REFINER?.template || '')
            .replace('{{currentTaxonomies}}', JSON.stringify(taxArray.map(t => ({ key: t.key, name: t.name, desc: t.description }))))
            .replace('{{feedbackDrift}}', JSON.stringify(drift.map(d => ({
                from: d._id.original,
                to: d._id.corrected,
                category: d._id.category,
                frequency: d.count,
                notes: d.examples.slice(0, 3)
            }))));

        const response = await callGeminiMini(prompt, tenantId, { correlationId, temperature: 0.2 });

        try {
            // Limpiar posible markdown del LLM
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = RefinementProposalSchema.parse(JSON.parse(cleanJson));

            await logEvento({
                level: 'INFO',
                source: 'SOVEREIGN_ENGINE',
                action: 'PROPOSALS_GENERATED',
                message: `Generadas ${parsed.proposals.length} propuestas de refinamiento para tenant ${tenantId}`,
                correlationId,
                details: { proposalsCount: parsed.proposals.length }
            });

            return parsed.proposals;
        } catch (error) {
            throw new AppError('INTERNAL_ERROR', 500, 'Error al procesar propuestas del Sovereign Engine');
        }
    }

    /**
     * Applies high-confidence refinements automatically.
     */
    static async applyAutonomousRefinements(tenantId: string, correlationId: string) {
        const proposals = await this.generateProposals(tenantId, correlationId);
        const highConfidence = proposals.filter(p => p.confidence >= 0.9);

        if (highConfidence.length === 0) return { applied: 0 };

        for (const proposal of highConfidence) {
            if (proposal.action === 'UPDATE' || proposal.action === 'CREATE') {
                // Implementación simplificada: En un entorno real esto requeriría validación humana
                // o un sistema de "Shadow Changes" primero.
                await logEvento({
                    level: 'WARN',
                    source: 'SOVEREIGN_ENGINE',
                    action: 'AUTONOMOUS_UPDATE',
                    message: `Aplicando actualización autónoma: ${proposal.targetKey} -> ${proposal.newName}`,
                    correlationId,
                    details: proposal
                });

                // Aplicar actualización vía batch
                await TaxonomyService.batchUpdateTaxonomies(highConfidence, tenantId, correlationId);
            }
        }

        return { applied: highConfidence.length };
    }
}
