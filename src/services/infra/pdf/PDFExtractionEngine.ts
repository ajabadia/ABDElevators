
import { extractTextFromPDF, extractTextAdvanced, cleanPDFText } from '@/lib/pdf-utils';
import { ExternalServiceError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { executeWithResilience, pdfResilience } from '@/lib/resilience';

export type ExtractionStrategy = 'BASIC' | 'ADVANCED' | 'AUTO';

export interface ExtractionResult {
    text: string;
    strategyUsed: ExtractionStrategy;
    durationMs: number;
}

/**
 * PDFExtractionEngine - Unified interface for PDF text extraction.
 * Phase 8: High-Impact Polish
 */
export class PDFExtractionEngine {

    /**
     * Extracts text from a PDF buffer using the specified strategy.
     */
    static async extract(
        buffer: Buffer,
        strategy: ExtractionStrategy = 'AUTO',
        correlationId: string = 'SYSTEM'
    ): Promise<ExtractionResult> {
        const start = Date.now();
        let strategyUsed: ExtractionStrategy = strategy;
        let text = '';

        try {
            if (strategy === 'BASIC' || strategy === 'AUTO' || strategy === 'ADVANCED') {
                // Phase 295: All strategies use the advanced parser as basic/legacy was removed for security.
                text = await executeWithResilience(
                    'PDF_EXTRACTION_ENGINE',
                    'EXTRACT_ADVANCED',
                    () => extractTextAdvanced(buffer),
                    correlationId,
                    'SYSTEM', // tenantId not strictly needed for the internal fetch but good for tracking
                    pdfResilience
                );
                strategyUsed = 'ADVANCED';
            }

            const durationMs = Date.now() - start;

            await logEvento({
                level: 'INFO',
                source: 'PDF_EXTRACTION_ENGINE',
                action: 'EXTRACT',
                message: `Extracted PDF text using ${strategyUsed} strategy`,
                correlationId,
                details: { strategy, strategyUsed, durationMs, textLength: text.length }
            });

            return {
                text: cleanPDFText(text),
                strategyUsed,
                durationMs
            };

        } catch (error: unknown) {
            const err = error as Error;
            const durationMs = Date.now() - start;
            await logEvento({
                level: 'ERROR',
                source: 'PDF_EXTRACTION_ENGINE',
                action: 'EXTRACT_FAILED',
                message: `Failed to extract PDF text: ${err.message}`,
                correlationId,
                details: { strategy, durationMs }
            });

            throw new ExternalServiceError('Fallo crítico en la extracción de texto del PDF', {
                message: err.message,
                details: { strategy, durationMs }
            });
        }
    }
}
