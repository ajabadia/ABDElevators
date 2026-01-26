import { ExternalServiceError } from './errors';
import { PDFParse } from 'pdf-parse';

/**
 * Extrae texto de un buffer PDF usando pdf-parse v2
 * Regla de Oro #3: AppError para manejo de errores
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    let pdf: PDFParse | null = null;
    try {
        // Convertir Buffer a Uint8Array si es necesario (el constructor lo maneja, pero explícito es mejor)
        pdf = new PDFParse({ data: buffer });

        // Extraer texto
        const result = await pdf.getText();

        return result.text;
    } catch (error: any) {
        console.error('Error extracting PDF text:', error);

        const errorDetails = {
            message: error.message || String(error),
            stack: error.stack,
            name: error.name
        };
        throw new ExternalServiceError('Fallo al extraer texto del PDF', errorDetails);
    } finally {
        if (pdf) {
            await pdf.destroy();
        }
    }
}
