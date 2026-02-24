import { PDFExtractionEngine } from './PDFExtractionEngine';
import { PIIMasker, PIIResult } from '@/services/security/pii-masker';
import { logEvento } from '@/lib/logger';

export interface PdfPipelineOptions {
    tenantId: string;
    correlationId: string;
    industry?: string;
    strategy?: 'BASIC' | 'ADVANCED' | 'AUTO';
    pii?: {
        enabled: boolean;
        detectOnly?: boolean;
        placeholder?: string;
    };
}

export interface PdfPipelineResult {
    rawText: string;
    cleanedText: string;
    maskedText?: string;
    piiMetadata?: PIIResult['metadata'];
    engineUsed: string;
}

/**
 * PDFIngestionPipeline - Orchestrates extraction and sanitization.
 * Phase 8.1 Orchestration.
 */
export class PDFIngestionPipeline {

    /**
     * Runs the full pipeline: Extractions -> Cleaning -> Masking.
     */
    static async runPipeline(buffer: Buffer, options: PdfPipelineOptions): Promise<PdfPipelineResult> {
        const { tenantId, correlationId, strategy = 'AUTO', pii } = options;
        const start = Date.now();

        // 1. Extraction (already includes cleanPDFText in the engine)
        const extraction = await PDFExtractionEngine.extract(buffer, strategy, correlationId);

        let finalText = extraction.text;
        let maskedText: string | undefined;
        let piiMetadata: PIIResult['metadata'] | undefined;

        // 2. PII Stage
        if (pii?.enabled) {
            if (pii.detectOnly) {
                const detection = PIIMasker.detect(extraction.text, tenantId, correlationId);
                piiMetadata = detection.metadata;
                // We keep original text for RAG, but have maskedText available if needed for UI
                maskedText = detection.processedText;
            } else {
                const masking = PIIMasker.mask(extraction.text, tenantId, correlationId);
                finalText = masking.maskedText;
                maskedText = masking.maskedText;
                piiMetadata = masking.metadata;
            }
        }

        const duration = Date.now() - start;

        // 3. Centralized Logging
        await logEvento({
            level: 'INFO',
            source: 'PDF_PIPELINE',
            action: 'PROCESS_COMPLETE',
            message: `Processed PDF in ${duration}ms. PII: ${pii?.enabled ? 'YES' : 'NO'}.`,
            correlationId,
            tenantId,
            details: {
                durationMs: duration,
                strategy,
                engine: extraction.strategyUsed,
                piiDetected: piiMetadata?.count || 0,
                textLength: extraction.text.length
            }
        });

        return {
            rawText: extraction.text, // ExtractionEngine already cleans it, but we refer to it as "raw" for the pipeline output
            cleanedText: extraction.text,
            maskedText,
            piiMetadata,
            engineUsed: extraction.strategyUsed
        };
    }
}
