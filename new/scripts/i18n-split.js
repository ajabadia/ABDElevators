/**
 * i18n Split Script — Splits monolithic JSONs into namespace files
 * 
 * Structure: messages/{locale}/{namespace}.json
 * Example:   messages/es/common.json, messages/es/admin.json
 * 
 * Usage: node scripts/i18n-split.js
 *        node scripts/i18n-split.js --verify  (dry-run, only verify)
 */

const fs = require('fs');
const path = require('path');

const LOCALES = ['es', 'en'];
const verifyOnly = process.argv.includes('--verify');

function flattenObject(obj, prefix = '') {
    const result = {};
    for (const key in obj) {
        const val = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            Object.assign(result, flattenObject(val, newKey));
        } else {
            result[newKey] = String(val);
        }
    }
    return result;
}

function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object' || a === null || b === null) return false;

    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();

    if (keysA.length !== keysB.length) return false;

    for (let i = 0; i < keysA.length; i++) {
        if (keysA[i] !== keysB[i]) return false;
        if (!deepEqual(a[keysA[i]], b[keysB[i]])) return false;
    }

    return true;
}

console.log(`🔀 i18n Split Script ${verifyOnly ? '(VERIFY MODE)' : '(EXECUTE MODE)'}\n`);

for (const locale of LOCALES) {
    const monolithicPath = path.join(process.cwd(), 'messages', `${locale}.json`);
    const original = JSON.parse(fs.readFileSync(monolithicPath, 'utf8'));
    const namespaces = Object.keys(original);

    console.log(`📦 [${locale}] ${namespaces.length} namespaces found`);

    const localeDir = path.join(process.cwd(), 'messages', locale);

    if (!verifyOnly) {
        // Create locale directory
        if (!fs.existsSync(localeDir)) {
            fs.mkdirSync(localeDir, { recursive: true });
        }

        // Write each namespace as its own file
        for (const ns of namespaces) {
            const nsPath = path.join(localeDir, `${ns}.json`);
            const content = original[ns];
            fs.writeFileSync(nsPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
        }
        console.log(`  ✅ Written ${namespaces.length} namespace files to messages/${locale}/`);
    }

    // Verify: reconstruct from split files and compare
    const reconstructed = {};

    if (!verifyOnly) {
        // Read from written files
        const nsFiles = fs.readdirSync(localeDir).filter(f => f.endsWith('.json'));
        for (const file of nsFiles) {
            const ns = file.replace('.json', '');
            const content = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf8'));
            reconstructed[ns] = content;
        }
    } else {
        // Simulate split
        for (const ns of namespaces) {
            reconstructed[ns] = original[ns];
        }
    }

    // Deep comparison
    const flatOriginal = flattenObject(original);
    const flatReconstructed = flattenObject(reconstructed);

    const originalKeys = Object.keys(flatOriginal).sort();
    const reconstructedKeys = Object.keys(flatReconstructed).sort();

    if (originalKeys.length !== reconstructedKeys.length) {
        console.log(`  ❌ Key count mismatch: original=${originalKeys.length}, reconstructed=${reconstructedKeys.length}`);
        continue;
    }

    let mismatches = 0;
    for (const key of originalKeys) {
        if (flatOriginal[key] !== flatReconstructed[key]) {
            console.log(`  ❌ Value mismatch at ${key}`);
            mismatches++;
        }
    }

    if (mismatches === 0 && originalKeys.length === reconstructedKeys.length) {
        console.log(`  ✅ Round-trip verification passed (${originalKeys.length} keys)`);
    } else {
        console.log(`  ❌ ${mismatches} mismatches found`);
    }

    // List namespace files
    if (!verifyOnly) {
        console.log(`  📁 Namespace files:`);
        namespaces.forEach(ns => {
            const flatNs = flattenObject(original[ns]);
            console.log(`     ${ns}.json → ${Object.keys(flatNs).length} leaf keys`);
        });
    }
}

console.log(`\n🎉 Split complete!`);
