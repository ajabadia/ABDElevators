import { analyzePDFVisuals } from '@/services/llm/llm-service';
import { IngestAnalysisService } from './IngestAnalysisService';
import { logEvento } from '@/lib/logger';
import { PDFIngestionPipeline } from '@/services/infra/pdf/PDFIngestionPipeline';
import { PDFTenantConfig } from '@/services/infra/pdf/PDFTenantConfig';
import { type KnowledgeAsset } from '@/lib/schemas/assets';
import { TenantSession } from '@/lib/db-tenant';
import { IngestOptions } from './types';

/**
 * IngestAnalyzer: Handles content extraction and semantic processing.
 * Refactored Phase 8.1: Orchestrated via PDFIngestionPipeline.
 */
export class IngestAnalyzer {
    static async analyze(
        buffer: Buffer,
        asset: KnowledgeAsset,
        correlationId: string,
        session?: TenantSession,
        options?: Partial<IngestOptions>
    ) {
        // 1. Resolve Config & Run Pipeline
        const ingestConfig = PDFTenantConfig.getIngestionConfig(asset.tenantId, (asset as any).industry || 'GENERIC');

        const [pipelineResult, visualFindings] = await Promise.all([
            PDFIngestionPipeline.runPipeline(buffer, {
                tenantId: asset.tenantId,
                correlationId,
                industry: (asset as any).industry,
                strategy: ingestConfig.extraction.strategy as any,
                pii: {
                    enabled: ingestConfig.pii.enabled,
                    detectOnly: ingestConfig.pii.detectOnly,
                    placeholder: ingestConfig.pii.placeholder
                }
            }),
            options?.enableVision ? analyzePDFVisuals(buffer, asset.tenantId, correlationId) : Promise.resolve([])
        ]);

        const rawText = pipelineResult.maskedText || pipelineResult.cleanedText;

        // 2. Industry Detection (already initialized with asset.industry if known)
        const isSimpleMode = !options?.enableVision && !options?.enableTranslation && !options?.enableGraphRag && !options?.enableCognitive;
        const detectedIndustry = await IngestAnalysisService.detectIndustry(rawText, asset.tenantId, correlationId, session, { skipAIFallback: isSimpleMode });

        // 3. Language & Models
        const { detectAndValidateLanguage, validateLanguageCode } = await import('@/services/core/LanguageValidator');
        let detectedLang = await detectAndValidateLanguage(rawText);
        let detectedModels: any[] = [];

        if (options?.enableTranslation) {
            const llmDetected = await IngestAnalysisService.detectLanguage(rawText, asset.tenantId, correlationId, session);
            detectedLang = validateLanguageCode(llmDetected);
        }

        if (!isSimpleMode && (options?.enableTranslation || options?.enableCognitive)) {
            detectedModels = await IngestAnalysisService.extractModels(rawText, asset.tenantId, correlationId, session);
        }

        // 4. Cognitive Context
        let documentContext = '';
        if (options?.enableCognitive) {
            const { CognitiveRetrievalService } = await import('@/services/core/cognitive-retrieval-service');
            documentContext = await CognitiveRetrievalService.generateDocumentContext(rawText, detectedIndustry, asset.tenantId, correlationId, session);
        }

        return {
            rawText,
            visualFindings,
            detectedIndustry,
            detectedLang,
            detectedModels,
            documentContext,
            pipelineMetadata: pipelineResult.piiMetadata
        };
    }
}
