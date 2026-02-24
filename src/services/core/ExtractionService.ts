import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { z } from "zod";

const ExtractedModelsArraySchema = z.array(z.object({
    type: z.string(),
    model: z.string()
}));

export class ExtractionService {
    /**
     * Extrae modelos y entidades de un texto de pedido usando el Core LLM unificado (Era 7).
     */
    static async extractModelsWithGemini(text: string, tenantId: string, correlationId: string, session?: any) {
        return await PromptRunner.runJson<any[]>({
            key: 'EXTRAER_MODELOS',
            variables: { text },
            schema: ExtractedModelsArraySchema,
            tenantId,
            correlationId,
            session
        });
    }
}
