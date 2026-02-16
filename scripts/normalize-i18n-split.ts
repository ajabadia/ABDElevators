import fs from 'fs';
import path from 'path';

/**
 * Script para normalizar los archivos de traducción divididos.
 * Elimina la redundancia donde un archivo [ns].json tiene una raíz {"ns": {...}}.
 */

const LOCALES = ['es', 'en'];
const MESSAGES_DIR = 'messages';

function nestToFlat(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, nestToFlat(value, newKey));
        } else {
            result[newKey] = String(value);
        }
    }
    return result;
}

function flatToNested(flat: Record<string, string>): any {
    const result: any = {};
    for (const [key, value] of Object.entries(flat)) {
        const parts = key.split('.');
        let current = result;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                current[part] = value;
            } else {
                current[part] = current[part] || {};
                current = current[part];
            }
        }
    }
    return result;
}

function normalize() {
    for (const locale of LOCALES) {
        const dir = path.join(MESSAGES_DIR, locale);
        if (!fs.existsSync(dir)) continue;

        const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const ns = file.replace('.json', '');
            const filePath = path.join(dir, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            let flat = nestToFlat(content);
            const newFlat: Record<string, string> = {};

            for (let [key, value] of Object.entries(flat)) {
                // Si la llave empieza por el namespace redundante, lo quitamos
                if (key === ns) continue; // Si es el objeto raíz vacío, saltamos
                if (key.startsWith(`${ns}.`)) {
                    key = key.slice(ns.length + 1);
                }
                newFlat[key] = value;
            }

            console.log(`🧹 Normalizado ${locale}/${file}: ${Object.keys(flat).length} -> ${Object.keys(newFlat).length} llaves.`);
            fs.writeFileSync(filePath, JSON.stringify(flatToNested(newFlat), null, 2), 'utf8');
        }
    }
}

normalize();
