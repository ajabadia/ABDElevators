import { extractTextAdvanced } from '@/lib/pdf-utils';
import { analyzePDFVisuals } from '@/lib/llm';
import { PromptService } from '@/lib/prompt-service';
import { callGeminiMini, extractModelsWithGemini } from '@/lib/llm';
import { getTenantCollection } from '@/lib/db-tenant';
import { logEvento } from '@/lib/logger';

/**
 * IngestAnalyzer: Handles content extraction and semantic processing (Phase 105 Hygiene).
 */
export class IngestAnalyzer {
    static async analyze(buffer: Buffer, asset: any, correlationId: string, session?: any) {
        // Phase 2: Import observability utilities
        const { IngestTracer } = await import('@/services/ingest/observability/IngestTracer');
        const { withLLMRetry } = await import('@/lib/llm-retry');
        const { LLMCostTracker } = await import('@/services/ingest/observability/LLMCostTracker');

        // 1. Extraction
        await logEvento({
            level: 'INFO',
            source: 'INGEST_ANALYZER',
            action: 'EXTRACTION_START',
            message: `Extracting text and visuals from document...`,
            correlationId,
            tenantId: asset.tenantId
        });
        const [rawText, visualFindings] = await Promise.all([
            extractTextAdvanced(buffer),
            analyzePDFVisuals(buffer, asset.tenantId, correlationId)
        ]);
        await logEvento({
            level: 'INFO',
            source: 'INGEST_ANALYZER',
            action: 'EXTRACTION_SUCCESS',
            message: `Extraction complete. Text length: ${rawText.length}, Visual elements: ${visualFindings.length}`,
            correlationId,
            tenantId: asset.tenantId
        });

        // 2. Domain Detection (Regla de Oro #4: Prompts from DB) - Already has observability
        await logEvento({
            level: 'INFO',
            source: 'INGEST_ANALYZER',
            action: 'DOMAIN_DETECTION_START',
            message: `Detecting document industry/domain...`,
            correlationId,
            tenantId: asset.tenantId
        });
        const { DomainRouterService } = await import('@/services/domain-router-service');
        const detectedIndustry = await DomainRouterService.detectIndustry(rawText, asset.tenantId, correlationId);
        await logEvento({
            level: 'INFO',
            source: 'INGEST_ANALYZER',
            action: 'DOMAIN_DETECTION_SUCCESS',
            message: `Domain detected: ${detectedIndustry}`,
            correlationId,
            tenantId: asset.tenantId
        });

        // 3. Language Detection - Phase 2: Add observability
        const langSpan = IngestTracer.startLanguageDetectionSpan({
            correlationId,
            tenantId: asset.tenantId,
        });

        let detectedLang = 'es'; // Default fallback

        try {
            const langStart = Date.now();
            const { text: languagePrompt, model: langModel } = await PromptService.getRenderedPrompt(
                'LANGUAGE_DETECTOR',
                { text: rawText.substring(0, 2000) },
                asset.tenantId,
                'PRODUCTION'
            );

            const langResponse = await withLLMRetry(
                () => callGeminiMini(languagePrompt, asset.tenantId, { correlationId, model: langModel }),
                {
                    operation: 'LANGUAGE_DETECTION',
                    tenantId: asset.tenantId,
                    correlationId,
                },
                { maxRetries: 2, timeoutMs: 5000 }
            );

            detectedLang = langResponse.trim().toLowerCase().substring(0, 2);
            const langDuration = Date.now() - langStart;

            // Track cost
            const langInputTokens = Math.ceil(languagePrompt.length / 4);
            const langOutputTokens = Math.ceil(langResponse.length / 4);
            await LLMCostTracker.trackOperation(
                correlationId,
                'LANGUAGE_DETECTION',
                langModel,
                langInputTokens,
                langOutputTokens,
                langDuration
            );

            await IngestTracer.endSpanSuccess(langSpan, { correlationId, tenantId: asset.tenantId }, {
                'llm.tokens.input': langInputTokens,
                'llm.tokens.output': langOutputTokens,
                'detected.language': detectedLang,
            });
        } catch (error: any) {
            await IngestTracer.endSpanError(langSpan, { correlationId, tenantId: asset.tenantId }, error);
            // Fallback to 'es'
        }

        // 4. Model Extraction - Phase 2: Add observability (delegated to ExtractionService, which we'll enhance)
        const detectedModels = await extractModelsWithGemini(rawText, asset.tenantId, correlationId);

        // 5. Cognitive Context (Phase 102) - Already has observability from CognitiveRetrievalService
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
