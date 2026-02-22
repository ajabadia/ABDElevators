
import { extractTextFromPDF, extractTextAdvanced, cleanPDFText } from '@/lib/pdf-utils';
import { ExternalServiceError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

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
            if (strategy === 'BASIC') {
                text = await extractTextFromPDF(buffer);
                strategyUsed = 'BASIC';
            } else if (strategy === 'ADVANCED') {
                text = await extractTextAdvanced(buffer);
                strategyUsed = 'ADVANCED';
            } else {
                // AUTO: Try advanced, fallback to basic logic is already inside extractTextAdvanced in pdf-utils,
                // but we wrap it here for better instrumentation.
                try {
                    text = await extractTextAdvanced(buffer);
                    strategyUsed = 'ADVANCED';
                } catch (error) {
                    console.warn('[PDF_EXTRACTION] Advanced failed, falling back to basic.', error);
                    text = await extractTextFromPDF(buffer);
                    strategyUsed = 'BASIC';
                }
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

        } catch (error: any) {
            const durationMs = Date.now() - start;
            await logEvento({
                level: 'ERROR',
                source: 'PDF_EXTRACTION_ENGINE',
                action: 'EXTRACT_FAILED',
                message: `Failed to extract PDF text: ${error.message}`,
                correlationId,
                details: { strategy, durationMs }
            });

            throw new ExternalServiceError('Fallo crítico en la extracción de texto del PDF', {
                message: error.message,
                details: { strategy, durationMs }
            });
        }
    }
}
