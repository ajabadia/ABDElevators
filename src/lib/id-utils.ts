import crypto from 'crypto';

/**
 * Genera un ID estable basado en el contenido.
 * Útil para items de checklist que no tienen ID propio en la ontología.
 */
export function generateStableId(content: string, prefix?: string): string {
    const hash = crypto.createHash('md5').update(content.trim().toLowerCase()).digest('hex').substring(0, 12);
    return prefix ? `${prefix}_${hash}` : hash;
}

/**
 * Genera un ID para un item de checklist basado en su texto para asegurar
 * estabilidad entre diferentes extracciones del mismo documento.
 */
export function generateChecklistItemId(label: string, category?: string): string {
    const normalizedCategory = category ? category.trim().toLowerCase().replace(/\s+/g, '_') : 'item';
    return generateStableId(label, normalizedCategory);
}
