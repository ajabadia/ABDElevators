import { ExternalServiceError } from './errors';

/**
 * Extrae texto de un buffer PDF
 * Regla de Oro #3: AppError para manejo de errores
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // Usamos require interno para evitar problemas de ESM en Node con pdf-parse
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        throw new ExternalServiceError('Fallo al extraer texto del PDF', error);
    }
}
