import { logEvento } from './logger';

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
    static async sanitizeQuery(input: unknown): Promise<Record<string, any>> {
        if (typeof input !== 'object' || input === null) {
            return {};
        }

        const sanitized: Record<string, any> = {};
        const entries = Object.entries(input as Record<string, any>);

        for (const [key, value] of entries) {
            // 1. Bloquear operadores sospechosos en las llaves
            if (this.FORBIDDEN_OPERATORS.some(op => key.includes(op))) {
                await logEvento({
                    level: 'WARN',
                    source: 'MONGOSANITIZER',
                    action: 'BLOCK_OPERATOR',
                    message: `Blocked potentially harmful MongoDB operator in key: ${key}`,
                    details: { operator: key }
                });
                continue;
            }

            // 2. Recursividad para objetos anidados o escalares
            if (Array.isArray(value)) {
                sanitized[key] = await Promise.all(value.map(async item =>
                    typeof item === 'object' ? await this.sanitizeQuery(item) : this.escapeIfString(item)
                ));
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = await this.sanitizeQuery(value);
            } else {
                sanitized[key] = this.escapeIfString(value);
            }
        }

        return sanitized;
    }

    /**
     * Sanitiza un valor individual (string o cualquier tipo).
     */
    static sanitize<T>(value: T): T {
        if (typeof value === 'string') {
            return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') as unknown as T;
        }
        return value;
    }

    private static escapeIfString(value: unknown): unknown {
        return this.sanitize(value);
    }
}
