import { extractTextAdvanced } from '@/lib/pdf-utils';
import { analyzePDFVisuals } from '@/lib/llm';
import { PromptService } from '@/lib/prompt-service';
import { callGeminiMini, extractModelsWithGemini } from '@/lib/llm';
import { getTenantCollection } from '@/lib/db-tenant';

/**
 * IngestAnalyzer: Handles content extraction and semantic processing (Phase 105 Hygiene).
 */
export class IngestAnalyzer {
    static async analyze(buffer: Buffer, asset: any, correlationId: string) {
        // 1. Extraction
        const [rawText, visualFindings] = await Promise.all([
            extractTextAdvanced(buffer),
            analyzePDFVisuals(buffer, asset.tenantId, correlationId)
        ]);

        // 2. Domain Detection (Regla de Oro #4: Prompts from DB)
        const { DomainRouterService } = await import('@/services/domain-router-service');
        const detectedIndustry = await DomainRouterService.detectIndustry(rawText, asset.tenantId, correlationId);

        // 3. Language & Models
        const { text: languagePrompt, model: langModel } = await PromptService.getRenderedPrompt(
            'LANGUAGE_DETECTOR',
            { text: rawText.substring(0, 2000) },
            asset.tenantId
        );
        const detectedLang = (await callGeminiMini(languagePrompt, asset.tenantId, { correlationId, model: langModel })).trim().toLowerCase().substring(0, 2);
        const detectedModels = await extractModelsWithGemini(rawText, asset.tenantId, correlationId);

        // 4. Cognitive Context (Phase 102)
        const { CognitiveRetrievalService } = await import('@/services/cognitive-retrieval-service');
        const documentContext = await CognitiveRetrievalService.generateDocumentContext(
            rawText,
            detectedIndustry,
            asset.tenantId,
            correlationId
        );

        return {
            rawText,
            visualFindings,
            detectedIndustry,
            detectedLang,
            detectedModels,
            documentContext
        };
    }
}
