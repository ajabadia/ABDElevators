import { Readable } from 'stream';

export class CsvStreamBuilder {
    /**
     * Converts an array of objects to a CSV stream.
     */
    static toCsvStream(data: any[]): Readable {
        if (data.length === 0) return Readable.from(['']);

        const headers = Object.keys(data[0]);
        const headerRow = headers.join(',') + '\n';

        const rows = data.map(item => {
            return headers.map(h => {
                const val = item[h];
                if (val === null || val === undefined) return '';
                // Escape commas and quotes
                const str = String(val).replace(/"/g, '""');
                return str.includes(',') ? `"${str}"` : str;
            }).join(',');
        }).join('\n');

        return Readable.from([headerRow, rows]);
    }

    /**
     * Deep flattens an object for better CSV representation.
     */
    static flattenObject(obj: any, prefix = ''): Record<string, any> {
        const result: any = {};
        for (const key in obj) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
                Object.assign(result, this.flattenObject(obj[key], newKey));
            } else {
                result[newKey] = obj[key];
            }
        }
        return result;
    }
}
