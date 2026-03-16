import { NextRequest, NextResponse } from 'next/server';
import { AppError, handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

// 🛡️ Phase 295: High-Impact Polish
// Use legacy build for Node.js environment to avoid DOMMatrix / browser issues.
// @ts-ignore
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Endpoint Interno Avanzado para Extracción de Texto de PDFs.
 * SLA: P95 < 5000ms
 */
async function POST_internal(req: NextRequest) {
    // Note: Since this is INTERNAL, it doesn't use standard session auth, but internal secret headers.
    // standard withCorrelation still applies for unified tracing.
    return withCorrelation(
        { level: 'INFO', source: 'SERVICE_PDF_ADVANCED', action: 'EXTRACT_TEXT' },
        async ({ log, correlationId }) => {
            try {
                const secret = req.headers.get('x-internal-secret');
                if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
                    throw new AppError('FORBIDDEN', 403, 'Unauthorized internal access');
                }

                const contentType = req.headers.get('content-type');
                if (contentType !== 'application/pdf') {
                    throw new AppError('BAD_REQUEST', 400, 'Invalid content type. Expected application/pdf');
                }

                const arrayBuffer = await req.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                if (buffer.length === 0) {
                    throw new AppError('BAD_REQUEST', 400, 'Empty PDF buffer');
                }

                await log({
                    message: 'Processing PDF with pdfjs-dist',
                    details: { size: buffer.length }
                });

                // Procesar con pdfjs-dist
                const loadingTask = pdfjs.getDocument({
                    data: new Uint8Array(buffer),
                    useSystemFonts: true,
                    disableFontFace: true,
                    isEvalSupported: false
                });

                const doc = await loadingTask.promise;
                let fullText = '';

                for (let i = 1; i <= doc.numPages; i++) {
                    const page = await doc.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items
                        .map((item: any) => 'str' in item ? item.str : '')
                        .join(' ');
                    
                    fullText += pageText + '\n\n';
                }

                await log({
                    message: `PDF extraction successful: ${doc.numPages} pages`,
                    details: { pages: doc.numPages, characters: fullText.length }
                });

                return NextResponse.json({
                    success: true,
                    text: fullText,
                    pages: doc.numPages,
                    correlationId
                });

            } catch (error: unknown) {
                return handleApiError(error, 'INTERNAL_PDF_ADVANCED_SERVICE', correlationId);
            }
        }
    );
}

export const POST = POST_internal; // No performance SLA interceptor here as it's an internal heavy-duty service
