import { ExternalServiceError } from './errors';
const pdf = require('pdf-parse');

/**
 * Extrae texto de un buffer de PDF.
 * Regla de Oro #3: AppError.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new ExternalServiceError('Fallo al extraer texto del PDF', error);
    }
}
