import fs from 'fs';
import path from 'path';

/**
 * Script para recuperar llaves perdidas tras la migración a archivos divididos.
 * Versión 2: Mejora el manejo de namespaces y escritura en archivos divididos.
 */

const LOCALES = ['es', 'en'];
const MONOLITH_BASE = 'messages';
const SPLIT_BASE = 'messages';
const SCAN_DIR = 'src';

interface FoundKey {
    fullKey: string;
    file: string;
}

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

const foundKeys: FoundKey[] = [];

function scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Buscar namespace en useTranslations
    const nsMatch = content.match(/useTranslations\(\s*['"](.*?)['"]\s*\)/);
    const namespace = nsMatch ? nsMatch[1] : null;

    // Buscar t('key')
    const tRegex = /t\(\s*['"](.*?)['"]\s*/g;
    let match;
    while ((match = tRegex.exec(content)) !== null) {
        let key = match[1];
        let fullKey = key;

        if (namespace) {
            fullKey = `${namespace}.${key}`;
        }

        foundKeys.push({ fullKey, file: filePath });
    }
}

function walkDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            if (fullPath.includes('node_modules') || fullPath.includes('.next')) continue;
            scanFile(fullPath);
        }
    }
}

async function run() {
    console.log('🔍 Escaneando código en busca de llaves i18n...');
    walkDir(SCAN_DIR);
    console.log(`✅ Encontradas ${foundKeys.length} ocurrencias de llaves.`);

    const uniqueFullKeys = Array.from(new Set(foundKeys.map(k => k.fullKey)));
    console.log(`📦 ${uniqueFullKeys.length} llaves únicas detectadas.`);

    for (const locale of LOCALES) {
        console.log(`\n🌐 Procesando locale: ${locale.toUpperCase()}`);

        const monolithPath = path.join(MONOLITH_BASE, `${locale}.json`);
        if (!fs.existsSync(monolithPath)) {
            console.warn(`⚠️ Monolito ${monolithPath} no encontrado. Saltando.`);
            continue;
        }

        const monolith = JSON.parse(fs.readFileSync(monolithPath, 'utf8'));
        const flatMonolith = nestToFlat(monolith);

        console.log(`[DEBUG] Monolith has ${Object.keys(flatMonolith).length} keys.`);
        console.log(`[DEBUG] First 10 keys: ${JSON.stringify(Object.keys(flatMonolith).slice(0, 10))}`);

        const restored: string[] = [];
        const missingFromMonolith: string[] = [];
        const alreadyInSplit: string[] = [];

        // Agrupamos por namespace para escribir una sola vez por archivo
        const updatesByNamespace: Record<string, Record<string, string>> = {};

        for (const fullKey of uniqueFullKeys) {
            // DEBUG
            if (fullKey === 'workshop.orders.new.title') {
                console.log(`[DEBUG] Checking ${fullKey}: In FlatMonolith? ${!!flatMonolith[fullKey]}`);
            }

            const parts = fullKey.split('.');
            const ns = parts[0];
            const splitFilePath = path.join(SPLIT_BASE, locale, `${ns}.json`);

            // 1. Cargar lo que ya hay en el split (si existe)
            let splitContent: Record<string, any> = {};
            if (fs.existsSync(splitFilePath)) {
                splitContent = JSON.parse(fs.readFileSync(splitFilePath, 'utf8'));
            }
            const flatSplit = nestToFlat(splitContent); // Nota: flatSplit tendrá llaves RELATIVAS si el split no tiene el prefijo de namespace

            // Espera, TranslationService espera que el split NO tenga el prefijo de namespace.
            // Así que si messages/es/common.json tiene {"loading": "Cargando"}, flatSplit["loading"] es "Cargando".
            // Pero fullKey es "common.loading".
            const relativeKey = fullKey.startsWith(`${ns}.`) ? fullKey.slice(ns.length + 1) : fullKey;

            // ¿Ya existe en el split?
            if (flatSplit[relativeKey]) {
                alreadyInSplit.push(fullKey);
                continue;
            }

            // 2. ¿Existe en el monolito?
            if (flatMonolith[fullKey]) {
                restored.push(fullKey);
                if (!updatesByNamespace[ns]) updatesByNamespace[ns] = {};
                updatesByNamespace[ns][relativeKey] = flatMonolith[fullKey];
            } else {
                missingFromMonolith.push(fullKey);
            }
        }

        // Aplicar actualizaciones
        for (const [ns, newFlatKeys] of Object.entries(updatesByNamespace)) {
            const splitFilePath = path.join(SPLIT_BASE, locale, `${ns}.json`);
            let existingSplit = {};
            if (fs.existsSync(splitFilePath)) {
                existingSplit = JSON.parse(fs.readFileSync(splitFilePath, 'utf8'));
            }

            let combinedFlat = nestToFlat(existingSplit);
            Object.assign(combinedFlat, newFlatKeys);

            const nsDir = path.dirname(splitFilePath);
            if (!fs.existsSync(nsDir)) fs.mkdirSync(nsDir, { recursive: true });

            fs.writeFileSync(splitFilePath, JSON.stringify(flatToNested(combinedFlat), null, 2), 'utf8');
        }

        console.log(`📊 Reporte para ${locale}:`);
        console.log(`   ✅ Ya presentes: ${alreadyInSplit.length}`);
        console.log(`   🔄 Restauradas: ${restored.length}`);
        console.log(`   ❌ No encontradas en monolito: ${missingFromMonolith.length}`);

        if (missingFromMonolith.length > 0) {
            console.log(`   ⚠️ Ejemplo de llaves no localizadas:`);
            missingFromMonolith.slice(0, 10).forEach(k => console.log(`      - ${k}`));
        }
    }
}

run().catch(console.error);
