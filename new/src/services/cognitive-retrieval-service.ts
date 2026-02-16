import { callGeminiMini } from '@/lib/llm';
import { PromptService } from '@/lib/prompt-service';
import { PROMPTS } from '@/lib/prompts';
import { logEvento } from '@/lib/logger';

/**
 * 🧠 Cognitive Retrieval Service (Phase 102)
 * Generates document-level context to enrich individual chunks.
 */
export class CognitiveRetrievalService {
    /**
     * Generates a concise context header for the entire document.
     */
    static async generateDocumentContext(
        text: string,
        industry: string,
        tenantId: string,
        correlationId?: string
    ): Promise<string> {
        let renderedPrompt: string;
        let modelName = 'gemini-1.5-flash';

        try {
            const { text: promptText, model } = await PromptService.getRenderedPrompt(
                'COGNITIVE_CONTEXT',
                {
                    text: text.substring(0, 5000),
                    industry: industry.toLowerCase()
                },
                tenantId
            );
            renderedPrompt = promptText;
            modelName = model;
        } catch (error) {
            console.warn(`[COGNITIVE_RETRIEVAL] ⚠️ Fallback to Master Prompt:`, error);
            await logEvento({
                level: 'WARN',
                source: 'COGNITIVE_RETRIEVAL',
                action: 'PROMPT_FALLBACK',
                message: 'Usando prompt maestro por error en BD',
                correlationId: correlationId || 'cognitive-retrieval-fallback',
                tenantId
            });
            renderedPrompt = PROMPTS.COGNITIVE_CONTEXT
                .replace('{{text}}', text.substring(0, 5000))
                .replace('{{industry}}', industry.toLowerCase());
        }

        try {
            const response = await callGeminiMini(renderedPrompt, tenantId, {
                correlationId: correlationId || 'cognitive-router',
                model: modelName
            });

            return response.trim();
        } catch (error: any) {
            console.error('[COGNITIVE RETRIEVAL ERROR]', error);
            return 'Documento técnico general sin contexto específico detectado.';
        }
    }
}
