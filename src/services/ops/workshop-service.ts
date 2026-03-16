import { z } from 'zod';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { PromptService } from '@/services/llm/prompt-service';
import { AI_MODEL_IDS, TenantId } from '@abd/platform-core';
import { performTechnicalSearch } from '@abd/rag-engine/server';
import { RagResult } from '@abd/rag-engine';
import { ObjectId } from 'mongodb';
import { withCorrelation } from '@/lib/logger/with-correlation';

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
        tenantId: TenantId,
        correlationId?: string,
        session?: TenantSession
    ) {
        return withCorrelation({ level: 'INFO', source: 'WORKSHOP_SERVICE', action: 'ANALYZE_ORDER', tenantId, correlationId }, async ({ log, correlationId: activeCorrelationId }) => {
            if (!session) throw new Error('Session is mandatory for WorkshopService');

            await log({
                message: `Starting workshop order analysis for entity ${entityId}`,
                details: { entityId, descriptionLength: orderDescription.length }
            });

        try {
            // 1. LLM Extraction using PromptService (Rule #12)
            const { text: renderedPrompt, model, version } = await PromptService.getRenderedPrompt(
                'WORKSHOP_PARTS_EXTRACTOR',
                { description: orderDescription },
                tenantId,
                'PRODUCTION',
                'ELEVATORS', // Vertical specific
                session,
                'WORKSHOP_ANALYSIS'
            );

            const { callGeminiMini } = await import('@/services/llm/llm-service');
            const llmResponse = await callGeminiMini(renderedPrompt, tenantId, {
                correlationId,
                model: model as any,
                temperature: 0.1
            });

            // Parse valid JSON from generic response
            const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new AppError('LLM_INVALID_RESPONSE', 500, 'Failed to parse JSON from LLM response');
            }

            const rawAnalysis: unknown = JSON.parse(jsonMatch[0]);
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

                    manuals = results.map((r: RagResult) => ({
                        title: r.source,
                        snippet: r.text.substring(0, 150) + '...',
                        score: r.score ?? 0
                    }));

                } catch (err: unknown) {
                    console.warn(`[WorkshopService] RAG failed for part ${part.partName}`, err instanceof Error ? err.message : err);
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

            // 3. Persist to Entity (Canonical: orders)
            const collection = await getTenantCollection('orders', session);

            await collection.updateOne(
                { _id: new ObjectId(entityId) },
                {
                    $set: {
                        'metadata.workshopAnalysis': finalAnalysis,
                        updatedAt: new Date()
                    }
                }
            );

                await log({
                    level: 'INFO',
                    message: `Workshop analysis completed for ${entityId}`,
                    details: {
                        partsCount: enrichedParts.length,
                        complexity: analysis.complexity
                    }
                });

                return finalAnalysis;

            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                const stack = error instanceof Error ? error.stack : undefined;

                await log({
                    level: 'ERROR',
                    message: `Error analyzing workshop order: ${message}`,
                    details: { error: stack || message }
                });
                throw error;
            }
        });
    }
}
