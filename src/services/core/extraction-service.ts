import { PromptRunner } from "../infra/llm/prompt-runner";
import { z } from "zod";

const ExtractedModelsArraySchema = z.array(z.object({
    type: z.string(),
    model: z.string()
}));

export class ExtractionService {
    /**
     * Extrae modelos y entidades de un texto de pedido usando PromptRunner.
     */
    static async extractModelsWithGemini(text: string, tenantId: string, correlationId: string, session?: any) {
        const modelos = await PromptRunner.runJsonPrompt<any[]>({
            key: 'EXTRAER_MODELOS',
            variables: { text },
            tenantId,
            correlationId,
            session
        });

        // Validación de esquema post-extracción
        try {
            ExtractedModelsArraySchema.parse(modelos);
            return modelos;
        } catch (error) {
            console.error("[EXTRACTION SCHEMA ERROR]", error);
            // Si falla el esquema, intentamos devolverlo de todos modos si es un array, 
            // o lanzamos si es crítico (aquí optamos por rigor)
            throw error;
        }
    }
}
