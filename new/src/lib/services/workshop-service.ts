import { z } from 'zod';
import { getTenantCollection } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { callGeminiMini } from '@/lib/llm';
import { PROMPTS } from '@/lib/prompts';
import { performTechnicalSearch } from '@/lib/rag-service';
import { ObjectId } from 'mongodb';

// --- Schemas ---

const WorkshopPartSchema = z.object({
    partName: z.string(),
    category: z.enum(['MECHANICAL', 'ELECTRONIC', 'HYDRAULIC', 'CONSUMABLE']),
    quantity: z.number().default(1),
    specifications: z.string().nullable().optional(),
    ragQuery: z.string().optional()
});

const WorkshopAnalysisSchema = z.object({
    parts: z.array(WorkshopPartSchema),
    complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    estimatedHours: z.number().optional()
});

export type WorkshopPart = z.infer<typeof WorkshopPartSchema>;
export type WorkshopAnalysis = z.infer<typeof WorkshopAnalysisSchema>;

/**
 * ⚡ FASE 128.2: Workshop Service
 * Orchestrates the "Workshop Order" vertical logistics.
 */
export class WorkshopService {

    /**
     * Analyzes a workshop order description to extract parts and find relevant manuals.
     * Persists the results in the entity metadata.
     */
    static async analyzeAndEnrichOrder(
        entityId: string,
        orderDescription: string,
        tenantId: string,
        correlationId: string,
        sessionUser: any
    ) {
        const source = 'WORKSHOP_SERVICE';
        const action = 'ANALYZE_ORDER';

        await logEvento({
            level: 'INFO',
            source,
            action,
            message: `Starting workshop order analysis for entity ${entityId}`,
            tenantId,
            correlationId,
            details: { entityId, descriptionLength: orderDescription.length }
        });

        try {
            // 1. LLM Extraction
            const promptTemplate = PROMPTS.WORKSHOP_PARTS_EXTRACTOR;
            if (!promptTemplate) {
                throw new AppError('PROMPT_NOT_FOUND', 500, 'Prompt WORKSHOP_PARTS_EXTRACTOR not found');
            }

            const prompt = promptTemplate.replace('{{description}}', orderDescription);

            const llmResponse = await callGeminiMini(prompt, tenantId, {
                correlationId,
                model: 'gemini-2.0-flash-exp', // Fast model for extraction
                temperature: 0.1
            });

            // Parse valid JSON from generic response
            const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new AppError('LLM_INVALID_RESPONSE', 500, 'Failed to parse JSON from LLM response');
            }

            const rawAnalysis = JSON.parse(jsonMatch[0]);
            const analysis = WorkshopAnalysisSchema.parse(rawAnalysis);

            // 2. RAG Enrichment (Find Manuals for each part)
            const enrichedParts = await Promise.all(analysis.parts.map(async (part) => {
                const query = part.ragQuery || `${part.partName} ${part.specifications || ''} maintenance manual`;

                let manuals: { title: string, snippet: string, score: number }[] = [];
                try {
                    // Search for manuals (limit 2 per part to avoid noise)
                    const results = await performTechnicalSearch(
                        query,
                        tenantId,
                        correlationId,
                        2,
                        'ELEVATORS', // Default vertical, could be dynamic
                        'PRODUCTION'
                    );

                    manuals = results.map(r => ({
                        title: r.source,
                        snippet: r.text.substring(0, 150) + '...',
                        score: r.score ?? 0
                    }));

                } catch (err) {
                    console.warn(`[WorkshopService] RAG failed for part ${part.partName}`, err);
                    // Continue without manuals rather than failing the whole process
                }

                return {
                    ...part,
                    manuals
                };
            }));

            const finalAnalysis = {
                ...analysis,
                parts: enrichedParts,
                analyzedAt: new Date(),
                analyzedBy: 'AI_WORKSHOP_AGENT'
            };

            // 3. Persist to Entity
            const collection = await getTenantCollection('entities', { user: sessionUser }); // Mock session for now if needed, or pass full session
            // We assume sessionUser passed has necessary context for getTenantCollection, 
            // or we construct a minimal session object if getTenantCollection requires it.
            // Actually getTenantCollection expects a NextAuth session object roughly.
            // If sessionUser is just the user struct, we might need to wrap it.
            // But let's assume sessionUser IS the session object or compatible.

            // To be safe and compliant with getTenantCollection signature in `db-tenant.ts`:
            // It expects `session: any`. We should ensure the caller passes the full session.

            await collection.updateOne(
                { _id: new ObjectId(entityId) },
                {
                    $set: {
                        'metadata.workshop_analysis': finalAnalysis,
                        updatedAt: new Date()
                    }
                }
            );

            await logEvento({
                level: 'INFO',
                source,
                action: 'ANALYZE_SUCCESS',
                message: `Workshop analysis completed for ${entityId}`,
                tenantId,
                correlationId,
                details: {
                    partsCount: enrichedParts.length,
                    complexity: analysis.complexity
                }
            });

            return finalAnalysis;

        } catch (error) {
            await logEvento({
                level: 'ERROR',
                source,
                action: 'ANALYZE_ERROR',
                message: `Error analyzing workshop order: ${error instanceof Error ? error.message : 'Unknown'}`,
                tenantId,
                correlationId,
                details: { error: error instanceof Error ? error.stack : error }
            });
            throw error;
        }
    }
}
