import { ExternalServiceError } from '@/lib/errors';
// Eliminamos import estático para evitar ReferenceError en inicialización de Vercel
// import { PDFParse } from 'pdf-parse';

/**
 * Extrae texto de un buffer PDF usando pdf-parse v2 (Legacy/Stable)
 * Regla de Oro #3: AppError para manejo de errores
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    let pdf: any = null;
    try {
        // Importación dinámica (Lazy Loading) para evitar problemas en Serverless
        const PDFParse = (await import('pdf-parse')).default;
        // @ts-ignore - Depende del tipo de export de la librería
        pdf = new (PDFParse as any)({ data: buffer });
        const result = await pdf.getText();
        return cleanPDFText(result.text);
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
 * Limpia "ruido" común de documentos PDF para mejorar la calidad del RAG.
 * Elimina:
 * - Números de página aislados (ej: "- 1 -", "Page 1 of 10")
 * - Headers/Footers repetitivos (patrones comunes)
 * - Exceso de espacios en blanco
 */
export function cleanPDFText(text: string): string {
    if (!text) return "";

    return text
        // 1. Unificar saltos de línea (Windows/Unix)
        .replace(/\r\n/g, '\n')

        // 2. Eliminar números de página comunes en líneas solas
        // Ej: "1", "- 1 -", "Page 1", "Página 1 de 10"
        .replace(/^\s*[-—]?\s*(?:Page|Página|Pág\.?)?\s*\d+\s*(?:of|de)?\s*\d*\s*[-—]?\s*$/gim, '')

        // 3. Eliminar líneas que parecen noise de escaneo o separadores
        .replace(/^_{5,}$/gm, '') // "_______"
        .replace(/^\s*$/gm, '')   // Líneas vacías extra (pre-trim)

        // 4. Colapsar múltiples saltos de línea (max 2 para parágrafos)
        .replace(/\n{3,}/g, '\n\n')

        // 5. Normalizar espacios horizontales (tabs, doble espacio)
        .replace(/[ \t]{2,}/g, ' ')

        .trim();
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

        return cleanPDFText(data.text);
    } catch (error) {
        console.warn('[PDF_ADVANCED] Fallback to standard parser due to:', error);
        return extractTextFromPDF(buffer); // Graceful Fallback
    }
}
