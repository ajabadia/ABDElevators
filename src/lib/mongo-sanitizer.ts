/**
 * 🛡️ MONGO SANITIZER (Audit 2401 & 2304)
 * Prevents NoSQL injection by sanitizing query inputs.
 */
export class MongoSanitizer {
    private static FORBIDDEN_OPERATORS = [
        '$where', '$eval', '$function',
        '$accumulator', '$group', '$reduce'
    ];

    /**
     * Sanitiza un objeto de consulta eliminando operadores prohibidos 
     * y escapando caracteres especiales en strings para evitar regex injection.
     */
    static sanitizeQuery(input: unknown): Record<string, any> {
        if (typeof input !== 'object' || input === null) {
            return {};
        }

        const sanitized: Record<string, any> = {};
        const entries = Object.entries(input as Record<string, any>);

        for (const [key, value] of entries) {
            // 1. Bloquear operadores sospechosos en las llaves
            if (this.FORBIDDEN_OPERATORS.some(op => key.includes(op))) {
                console.warn(`[SECURITY] Blocked potentially harmful MongoDB operator in key: ${key}`);
                continue;
            }

            // 2. Recursividad para objetos anidados o escalares
            if (Array.isArray(value)) {
                sanitized[key] = value.map(item =>
                    typeof item === 'object' ? this.sanitizeQuery(item) : this.escapeIfString(item)
                );
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeQuery(value);
            } else {
                sanitized[key] = this.escapeIfString(value);
            }
        }

        return sanitized;
    }

    private static escapeIfString(value: unknown): unknown {
        if (typeof value === 'string') {
            // Escapar caracteres especiales de regex para evitar DoS por regex maliciosos
            return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        return value;
    }
}
