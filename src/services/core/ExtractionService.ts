import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { z } from "zod";

const ExtractedModelsArraySchema = z.array(z.object({
    type: z.string(),
    model: z.string()
}));

export class ExtractionService {
    /**
     * Extracts models and entities from an order text using the unified Core LLM (Era 7).
     */
    static async extractModelsWithGemini(text: string, tenantId: string, correlationId: string, session?: any) {
        return await PromptRunner.runJson<any[]>({
            key: 'EXTRACT_MODELS',
            variables: { text },
            schema: ExtractedModelsArraySchema,
            tenantId,
            correlationId,
            session
        });
    }
}
