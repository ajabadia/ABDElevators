import { z } from 'zod';
import { getTenantCollection, TenantSession } from '@/lib/db-tenant';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { callGeminiMini, generateEmbedding } from '@/services/llm/llm-service';
import { PromptService } from '@/services/llm/prompt-service';
import { AI_MODEL_IDS, ModelName } from '@abd/platform-core';
import { PROMPTS } from '@/lib/prompts';
import { performTechnicalSearch } from '@abd/rag-engine/server';
import { RagResult } from '@abd/rag-engine';
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
        session: TenantSession
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

            const prompt = (promptTemplate?.template || '').replace('{{description}}', orderDescription);

            const llmResponse = await callGeminiMini(prompt, tenantId, {
                correlationId,
                model: AI_MODEL_IDS.GEMINI_2_5_FLASH, // Fast model for extraction
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

            // 3. Persist to Entity
            const collection = await getTenantCollection('entities', session);

            await collection.updateOne(
                { _id: new ObjectId(entityId) },
                {
                    $set: {
                        'metadata.workshopAnalysis': finalAnalysis,
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

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            const stack = error instanceof Error ? error.stack : undefined;

            await logEvento({
                level: 'ERROR',
                source,
                action: 'ANALYZE_ERROR',
                message: `Error analyzing workshop order: ${message}`,
                tenantId,
                correlationId,
                details: { error: stack || message }
            });
            throw error;
        }
    }
}
