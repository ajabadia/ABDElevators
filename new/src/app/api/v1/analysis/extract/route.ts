import { NextResponse } from 'next/server';
import { publicApiHandler } from '@/lib/api-handler';
import { extractModelsWithGemini, analyzeEntityWithGemini } from '@/lib/llm';
import { EntityEngine } from '@/core/engine/EntityEngine';
import { z } from 'zod';

const AnalysisSchema = z.object({
    text: z.string().min(10, "Text too short"),
    entityType: z.string().optional(), // "error_code", "component", etc.
});

export const POST = publicApiHandler(
    'analysis:extract',
    async (req, { tenantId, correlationId }) => {
        const body = await req.json();
        const { text, entityType } = AnalysisSchema.parse(body);

        let data;

        if (entityType) {
            // Use Adaptive Entity Engine (Phase 32)
            // Verify if entity type exists in registry?
            // For now, assume it's valid or engine handles it.
            data = await analyzeEntityWithGemini(entityType, text, tenantId, correlationId);
        } else {
            // Default: Extract Models/Patterns (Legacy)
            data = await extractModelsWithGemini(text, tenantId, correlationId);
        }

        return NextResponse.json({
            success: true,
            meta: {
                correlationId,
                engine: entityType ? 'adaptive_entity_engine_v32' : 'pattern_extractor_v1'
            },
            data
        });
    }
);
