import { ExternalServiceError } from '@/lib/errors';
import { PDFParse } from 'pdf-parse';

/**
 * Extrae texto de un buffer PDF usando pdf-parse v2 (Legacy/Stable)
 * Regla de Oro #3: AppError para manejo de errores
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    let pdf: PDFParse | null = null;
    try {
        pdf = new PDFParse({ data: buffer });
        const result = await pdf.getText();
        return result.text;
    } catch (error: any) {
        console.error('Error extracting PDF text:', error);
        throw new ExternalServiceError('Fallo al extraer texto del PDF', {
            message: error.message || String(error),
            stack: error.stack
        });
    } finally {
        if (pdf) {
            await pdf.destroy();
        }
    }
}

/**
 * Extrae texto de un buffer PDF usando el motor avanzado PyMuPDF (vía API Bridge/Python)
 * Proporciona mejor precisión en layouts complejos y tablas.
 */
export async function extractTextAdvanced(buffer: Buffer): Promise<string> {
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Convertimos Buffer a Uint8Array para compatibilidad con fetch global
        const uint8Array = new Uint8Array(buffer);
        const blob = new Blob([uint8Array], { type: 'application/pdf' });

        const response = await fetch(`${appUrl}/api/v1/pdf/advanced`, {
            method: 'POST',
            body: blob,
            headers: {
                'Content-Type': 'application/pdf',
            }
        });

        if (!response.ok) {
            throw new Error(`Advanced PDF API error: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Unknown error in advanced parsing');
        }

        return data.text;
    } catch (error) {
        console.warn('[PDF_ADVANCED] Fallback to standard parser due to:', error);
        return extractTextFromPDF(buffer); // Graceful Fallback
    }
}
