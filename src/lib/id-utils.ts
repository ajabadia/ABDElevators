


/**
 * Genera un ID estable basado en el contenido.
 * Útil para items de checklist que no tienen ID propio en la ontología.
 */
export function generateStableId(content: string, prefix?: string): string {
    // Fallback if crypto is not available (Edge Runtime / Client Safety)
    const cryptoObj = typeof crypto !== 'undefined' ? crypto : (typeof globalThis !== 'undefined' ? (globalThis as any).crypto : null);

    if (!cryptoObj || typeof cryptoObj.createHash !== 'function') {
        // Simple fallback hash for non-critical IDs
        let h = 0;
        for (let i = 0; i < content.length; i++) {
            h = ((h << 5) - h) + content.charCodeAt(i);
            h |= 0;
        }
        return prefix ? `${prefix}_${Math.abs(h).toString(16)}` : Math.abs(h).toString(16);
    }
    const hash = cryptoObj.createHash('md5').update(content.trim().toLowerCase()).digest('hex').substring(0, 12);

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
