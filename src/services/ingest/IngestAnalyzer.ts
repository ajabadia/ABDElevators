
import { analyzePDFVisuals } from '@/services/llm/llm-service';
import { IngestAnalysisService } from './IngestAnalysisService';
import { logEvento } from '@/lib/logger';
import { PDFIngestionPipeline } from '@/services/infra/pdf/PDFIngestionPipeline';
import { PDFTenantConfig } from '@/services/infra/pdf/PDFTenantConfig';

/**
 * IngestAnalyzer: Handles content extraction and semantic processing.
 * Refactored Phase 8.1: Orchestrated via PDFIngestionPipeline.
 */
export class IngestAnalyzer {
    static async analyze(buffer: Buffer, asset: any, correlationId: string, session?: any, options?: any) {
        // 1. Resolve Config & Run Pipeline
        const ingestConfig = PDFTenantConfig.getIngestionConfig(asset.tenantId, asset.industry);

        const [pipelineResult, visualFindings] = await Promise.all([
            PDFIngestionPipeline.runPipeline(buffer, {
                tenantId: asset.tenantId,
                correlationId,
                industry: asset.industry,
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
        let detectedLang = 'es';
        let detectedModels: any[] = [];

        if (options?.enableTranslation) {
            detectedLang = await IngestAnalysisService.detectLanguage(rawText, asset.tenantId, correlationId, session);
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
