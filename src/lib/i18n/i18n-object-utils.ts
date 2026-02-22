
/**
 * 🌐 I18N Object Utilities
 * Proposito: Utilidades para manipular objetos de traducción anidados (nesting/flattening/merging).
 */
export class I18nObjectUtils {
    /**
     * Aplana un objeto anidado (p.ej. { a: { b: 'c' } } -> { 'a.b': 'c' }).
     */
    static flattenObject(obj: any, prefix = ''): Record<string, string> {
        const result: Record<string, string> = {};
        if (!obj) return result;

        for (const key in obj) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(result, this.flattenObject(value, newKey));
            } else {
                result[newKey] = String(value);
            }
        }
        return result;
    }

    /**
     * Convierte un objeto plano con llaves punteadas en un objeto anidado.
     */
    static flatToNested(flat: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(flat)) {
            const keys = key.split('.');
            let current = result;
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                if (i === keys.length - 1) {
                    current[k] = value;
                } else {
                    if (current[k] === undefined || typeof current[k] !== 'object' || current[k] === null) {
                        current[k] = {};
                    }
                    current = current[k];
                }
            }
        }
        return result;
    }

    /**
     * Inserta un valor en un objeto usando una ruta punteada.
     */
    static setNestedKey(obj: any, flatKey: string, value: any): void {
        const keys = flatKey.split('.');
        let current = obj;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (i === keys.length - 1) {
                current[k] = value;
            } else {
                if (current[k] === undefined || typeof current[k] !== 'object' || current[k] === null) {
                    current[k] = {};
                }
                current = current[k];
            }
        }
    }

    /**
     * Mezcla profunda (deep merge) de dos objetos.
     */
    static deepMerge(target: any, source: any): any {
        const output = { ...target };
        if (typeof target === 'object' && target !== null && typeof source === 'object' && source !== null) {
            Object.keys(source).forEach(key => {
                if (typeof source[key] === 'object' && source[key] !== null) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    /**
     * Cuenta cuántas llaves hoja (strings/hojas) tiene el objeto.
     */
    static countLeafKeys(obj: any): number {
        let count = 0;
        if (!obj) return 0;
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                count += this.countLeafKeys(obj[key]);
            } else {
                count++;
            }
        }
        return count;
    }
}
