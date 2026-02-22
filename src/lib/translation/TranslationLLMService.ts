
import { callGemini } from '../llm';
import { PromptService } from '../prompt-service';
import { PROMPTS } from '../prompts';
import { DEFAULT_MODEL } from '../constants/ai-models';
import { LlmJsonUtils } from '../llm/json-utils';
import { TranslationRepository } from './TranslationRepository';
import { TranslationCache } from './TranslationCache';

/**
 * 🤖 Translation LLM Service
 * Proposito: Gestión de traducciones automáticas usando modelos generativos.
 */
export class TranslationLLMService {
    /**
     * Usa IA para traducir un set de llaves.
     */
    static async autoTranslate(params: {
        sourceLocale: string;
        targetLocale: string;
        keysToProcess: string; // Ya formateado como string para el prompt
        tenantId: string;
        correlationId: string;
    }) {
        const { sourceLocale, targetLocale, keysToProcess, tenantId, correlationId } = params;

        // 1. Obtener Prompt Dinámico
        let prompt: string;
        let model: string = DEFAULT_MODEL;

        try {
            const rendered = await PromptService.getRenderedPrompt(
                'I18N_AUTO_TRANSLATE',
                { sourceLocale, targetLocale, translationsToProcess: keysToProcess },
                tenantId
            );
            prompt = rendered.text;
            model = rendered.model;
        } catch (err) {
            console.warn(`[TranslationLLMService] ⚠️ Fallback to master prompt:`, err);
            prompt = (PROMPTS.I18N_AUTO_TRANSLATE?.template || '')
                .replace('{{sourceLocale}}', sourceLocale)
                .replace('{{targetLocale}}', targetLocale)
                .replace('{{translationsToProcess}}', keysToProcess);
        }

        const response = await callGemini(prompt, tenantId, correlationId, { temperature: 0.1, model });

        // 2. Parsear y persistir
        const translatedMap = LlmJsonUtils.safeParseLLMJson<Record<string, string>>(response, correlationId);
        if (!translatedMap) return { success: false, count: 0 };

        const operations = Object.entries(translatedMap).map(([key, value]) => {
            if (!key) return null;
            return {
                updateOne: {
                    filter: {
                        key,
                        locale: targetLocale,
                        tenantId: tenantId || 'platform_master',
                        isCustomized: { $ne: true }
                    },
                    update: {
                        $set: {
                            value,
                            locale: targetLocale,
                            namespace: key.split('.')[0] || 'common',
                            isObsolete: false,
                            lastUpdated: new Date(),
                            updatedBy: 'AI_GEMINI',
                            tenantId: tenantId || 'platform_master'
                        },
                        $setOnInsert: { isCustomized: false }
                    },
                    upsert: true
                }
            };
        }).filter(Boolean);

        if (operations.length > 0) {
            await TranslationRepository.bulkUpdate(operations, tenantId || 'platform_master');
            await TranslationCache.invalidate(targetLocale, tenantId || 'platform_master');
        }

        return { success: true, count: operations.length };
    }
}
