
import { ValidationError } from '@/lib/errors';

/**
 * ✅ Ingest Validator
 * Proposito: Validar reglas de negocio antes de iniciar la ingesta.
 */
export class IngestValidator {
    private static MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB
    private static SUPPORTED_CHUNK_LEVELS = ['bajo', 'medio', 'alto', 'SIMPLE', 'SEMANTIC', 'LLM'];

    /**
     * Valida el tamaño del archivo.
     */
    static validateFileSize(sizeBytes: number) {
        if (sizeBytes > this.MAX_FILE_SIZE) {
            throw new ValidationError(`Archivo demasiado grande. Máximo 250MB. Recibido: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB`);
        }
    }

    /**
     * Valida y normaliza el nivel de fragmentación.
     */
    static normalizeChunkingLevel(level?: string): string {
        if (level && !this.SUPPORTED_CHUNK_LEVELS.includes(level)) {
            console.warn(`[IngestValidator] Nivel '${level}' no soportado. Usando 'medio'.`);
            return 'medio';
        }
        return level || 'medio';
    }

    /**
     * Determina si un archivo debe usar streaming basado en su tamaño (TH > 100MB).
     */
    static shouldUseStreaming(sizeBytes: number): boolean {
        return sizeBytes > 100 * 1024 * 1024;
    }
}
