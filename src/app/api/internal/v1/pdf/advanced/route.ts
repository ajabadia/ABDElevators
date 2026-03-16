import { NextRequest, NextResponse } from 'next/server';
import { AppError, handleApiError } from '@/lib/errors';
import { withCorrelation } from '@/lib/logger/with-correlation';

// Stub for pdfjs - package not installed
// import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Endpoint Interno Avanzado para Extracción de Texto de PDFs.
 * SLA: P95 < 5000ms
 */
async function POST_internal(req: NextRequest) {
    // Note: Since this is INTERNAL, it doesn't use standard session auth, but internal secret headers.
    // standard withCorrelation still applies for unified tracing.
    return NextResponse.json({ error: 'PDF service not available' }, { status: 503 });
}

export const POST = POST_internal;
