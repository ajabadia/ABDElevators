import { ExternalServiceError } from '@/lib/errors';

/**
 * Verifica los 'magic numbers' del archivo para asegurar que genuinamente es un PDF.
 * Los primeros 4 bytes deben ser '%PDF' (Hex: 25 50 44 46).
 * Previene ataques de subida de archivos maliciosos renombrados.
 */
export async function isValidPDFMagicNumber(buffer: Buffer | ArrayBuffer): Promise<boolean> {
    const arr = new Uint8Array(buffer).subarray(0, 4);
    return arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46;
}

/**
 * Regla de Oro #3: AppError para manejo de errores
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    console.warn('[SECURITY_DEPRECATION] Legacy extractTextFromPDF called. Redirecting to Advanced Parser. Legacy pdf-parse has been removed due to CVEs (Phase 295).');
    return extractTextAdvanced(buffer);
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
