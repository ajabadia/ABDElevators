import { ExternalServiceError } from './errors';

/**
 * Extrae texto de un buffer PDF
 * Regla de Oro #3: AppError para manejo de errores
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // Importación dinámica usando require para compatibilidad con CommonJS
        // pdf-parse es un módulo CommonJS que no tiene export default en ESM
        const pdfParse = (await eval('import("pdf-parse")')).default || require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        throw new ExternalServiceError('Fallo al extraer texto del PDF', error);
    }
}
