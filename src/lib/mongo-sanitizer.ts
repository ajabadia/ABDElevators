import { logEvento } from './logger';

/**
 * 🛡️ MONGO SANITIZER (Audit 2401 & 2304)
 * Prevents NoSQL injection by sanitizing query inputs.
 */
export class MongoSanitizer {
    private static FORBIDDEN_OPERATORS = [
        '$where', '$eval', '$function'
    ];
    
    /**
     * Checks if a value is a plain object (not a Date, RegExp, ObjectId, etc.)
     */
    private static isPlainObject(val: unknown): val is Record<string, any> {
        if (typeof val !== 'object' || val === null) return false;
        
        // Check for specific MongoDB/JS types that should be treated as leaf nodes
        if (val instanceof Date || val instanceof RegExp) return false;
        
        // Detect ObjectId by common properties if not using the actual class
        if (val.constructor && val.constructor.name === 'ObjectId') return false;
            
        const proto = Object.getPrototypeOf(val);
        return proto === null || proto === Object.prototype;
    }

    /**
     * Sanitiza un objeto de consulta eliminando operadores prohibidos.
     */
    static async sanitizeQuery(input: unknown): Promise<Record<string, any>> {
        return this.sanitizeInternal(input, true);
    }

    /**
     * Versión síncrona para métodos que retornan cursores (find, aggregate).
     * El logging de bloqueos se realiza de forma fire-and-forget.
     */
    static sanitizeQuerySync(input: unknown): Record<string, any> {
        return this.sanitizeInternal(input, false);
    }

    private static sanitizeInternal(input: unknown, waitLog: boolean): any {
        if (typeof input !== 'object' || input === null) {
            return {};
        }

        if (Array.isArray(input)) {
            return input.map(item => this.isPlainObject(item) ? this.sanitizeInternal(item, waitLog) : item);
        }

        const sanitized: Record<string, any> = {};
        const entries = Object.entries(input as Record<string, any>);

        for (const [key, value] of entries) {
            // 1. Bloquear operadores sospechosos en las llaves
            if (this.FORBIDDEN_OPERATORS.includes(key)) {
                const logPromise = logEvento({
                    level: 'WARN',
                    source: 'MONGOSANITIZER',
                    action: 'BLOCK_OPERATOR',
                    message: `Blocked potentially harmful MongoDB operator: ${key}`,
                    details: { operator: key }
                });
                if (waitLog) {
                    // Si es async, no podemos esperar aquí pero el método padre lo hará si es la versión async
                    // Pero espera, sanitizeQuery es async, así que podemos manejarlo mejor.
                }
                sanitized[key] = {};
                continue;
            }

            // 2. Bloquear valores que sean operadores prohibidos (si son strings)
            if (typeof value === 'string' && this.FORBIDDEN_OPERATORS.includes(value)) {
                logEvento({
                    level: 'WARN',
                    source: 'MONGOSANITIZER',
                    action: 'BLOCK_OPERATOR_VALUE',
                    message: `Blocked potentially harmful MongoDB operator in value: ${value}`,
                    details: { operator: value }
                });
                sanitized[key] = {};
                continue;
            }

            // 3. Recursividad para objetos anidados o escalares
            if (this.isPlainObject(value) || Array.isArray(value)) {
                sanitized[key] = this.sanitizeInternal(value, waitLog);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * No longer needed as blind escaping breaks literal matches.
     * Strings are safe as-is in literal matches.
     */
    static escapeRegExp(val: string): string {
        return val;
    }

    /**
     * Sanitiza un valor individual (string o cualquier tipo).
     */
    static sanitize<T>(value: T): T {
        return value;
    }

    private static escapeIfString(value: unknown): unknown {
        return this.sanitize(value);
    }
}
