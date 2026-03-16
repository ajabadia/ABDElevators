import { PromptRunner } from '@/lib/llm-core/PromptRunner';
import { z } from 'zod';
import { AnyBulkWriteOperation, Document } from 'mongodb';
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
        keysToProcess: string;
        tenantId: string;
        correlationId: string;
    }) {
        const { sourceLocale, targetLocale, keysToProcess, tenantId, correlationId } = params;

        try {
            // Rule #12: Prompt Governance - Use PromptRunner.runJson
            const translatedMap = await PromptRunner.runJson({
                key: 'I18N_AUTO_TRANSLATE',
                variables: { sourceLocale, targetLocale, translationsToProcess: keysToProcess },
                schema: z.record(z.string(), z.string()),
                tenantId: tenantId || 'platform_master',
                correlationId,
                temperature: 0.1,
                task: 'I18N_TRANSLATION'
            });

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
            }).filter(Boolean) as AnyBulkWriteOperation<Document>[];

            if (operations.length > 0) {
                await TranslationRepository.bulkUpdate(operations, tenantId || 'platform_master');
                await TranslationCache.invalidate(targetLocale, tenantId || 'platform_master');
            }

            return { success: true, count: operations.length };
        } catch (error: unknown) {
            console.error(`[TranslationLLMService] ❌ Translation failed:`, error);
            return { success: false, count: 0 };
        }
    }
}
