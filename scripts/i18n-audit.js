/**
 * i18n Audit Script V2 — Dead + Missing Key Detection (Improved)
 * 
 * Improvements over V1:
 * - Scans ALL string literals that match i18n key patterns (not just t() calls)
 * - Handles multi-level namespaces (e.g. feature_pages.federated)
 * - Detects config-based key references (navigation configs, etc.)
 * - Better classification of dynamic vs static keys
 * 
 * Usage: node scripts/i18n-audit.js
 * Output: scripts/i18n-audit-report.json
 */

const fs = require('fs');
const path = require('path');

// ── Helpers ──────────────────────────────────────────

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

function getAllFiles(dir, extensions, result = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', '.next', '.git', 'dist', 'build', '.agent'].includes(entry.name)) continue;
            getAllFiles(fullPath, extensions, result);
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
            result.push(fullPath);
        }
    }
    return result;
}

// ── Extract keys used in code ────────────────────────

function extractKeysFromCode(files, allJsonKeys) {
    const usedKeys = new Set();
    const dynamicKeys = [];
    const namespaceUsages = new Map();

    // Build a set of all known key prefixes (for matching config references)
    const knownKeyPrefixes = new Set();
    for (const key of allJsonKeys) {
        const parts = key.split('.');
        for (let i = 1; i <= parts.length; i++) {
            knownKeyPrefixes.add(parts.slice(0, i).join('.'));
        }
    }

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const relPath = path.relative(process.cwd(), file);

        // ── Step 1: Find all useTranslations/getTranslations namespace declarations ──
        const nsRegex = /(?:useTranslations|getTranslations)\(\s*['"]([^'"]+)['"]\s*\)/g;
        let nsMatch;
        const fileNamespaces = [];
        while ((nsMatch = nsRegex.exec(content)) !== null) {
            fileNamespaces.push(nsMatch[1]);
        }

        if (fileNamespaces.length > 0) {
            namespaceUsages.set(relPath, fileNamespaces);
        }

        // ── Step 2: Find t('key'), tX('key') calls ──
        // Matches: t('key'), t("key"), tPage('key'), tNotif('key'), etc.
        const tCallRegex = /\bt\w*\(\s*['"]([^'"]+)['"]\s*\)/g;
        let tMatch;
        while ((tMatch = tCallRegex.exec(content)) !== null) {
            const subKey = tMatch[1];

            // Skip if it looks like a full URL, CSS class, or path
            if (subKey.includes('/') || subKey.includes(':') || subKey.startsWith('.')) continue;

            if (fileNamespaces.length > 0) {
                for (const ns of fileNamespaces) {
                    usedKeys.add(`${ns}.${subKey}`);
                }
            } else {
                // If no namespace found, check if it's a known full key
                if (allJsonKeys.has(subKey) || knownKeyPrefixes.has(subKey)) {
                    usedKeys.add(subKey);
                }
            }
        }

        // ── Step 3: Detect dynamic keys (template literals) ──
        const dynamicRegex = /\bt\w*\(\s*`[^`]*\$\{[^`]*`\s*\)/g;
        let dynMatch;
        while ((dynMatch = dynamicRegex.exec(content)) !== null) {
            dynamicKeys.push({ file: relPath, pattern: dynMatch[0].substring(0, 120) });
        }

        // ── Step 4: Scan ALL string literals for i18n key references ──
        // This catches config files, navigation definitions, etc.
        // Look for string literals that match known JSON key patterns
        const stringLiteralRegex = /['"]([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){1,5})['"]/g;
        let strMatch;
        while ((strMatch = stringLiteralRegex.exec(content)) !== null) {
            const candidate = strMatch[1];
            // Only count it if it's a known key or a prefix of known keys
            if (allJsonKeys.has(candidate)) {
                usedKeys.add(candidate);
            } else if (knownKeyPrefixes.has(candidate)) {
                // It's a namespace prefix — mark all children as potentially used
                for (const jsonKey of allJsonKeys) {
                    if (jsonKey.startsWith(candidate + '.')) {
                        usedKeys.add(jsonKey);
                    }
                }
            }
        }
    }

    return { usedKeys, dynamicKeys, namespaceUsages };
}

// ── Main ─────────────────────────────────────────────

function main() {
    console.log('🔍 i18n Audit V2 — Scanning for dead and missing keys...\n');

    // 1. Load JSON files
    const esPath = path.join(process.cwd(), 'messages', 'es.json');
    const enPath = path.join(process.cwd(), 'messages', 'en.json');

    if (!fs.existsSync(esPath) || !fs.existsSync(enPath)) {
        console.error('❌ messages/es.json or messages/en.json not found');
        process.exit(1);
    }

    const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    const flatEs = flattenObject(es);
    const flatEn = flattenObject(en);

    const allJsonKeys = new Set([...Object.keys(flatEs), ...Object.keys(flatEn)]);

    console.log(`📄 es.json: ${Object.keys(flatEs).length} flat keys`);
    console.log(`📄 en.json: ${Object.keys(flatEn).length} flat keys`);
    console.log(`📄 Union: ${allJsonKeys.size} unique keys\n`);

    // 2. Scan code
    const srcDir = path.join(process.cwd(), 'src');
    const files = getAllFiles(srcDir, ['.ts', '.tsx']);
    console.log(`📂 Scanning ${files.length} files in src/...\n`);

    const { usedKeys, dynamicKeys, namespaceUsages } = extractKeysFromCode(files, allJsonKeys);
    console.log(`🔑 Found ${usedKeys.size} unique key references in code`);
    console.log(`⚡ Found ${dynamicKeys.length} dynamic key patterns (manual review needed)\n`);

    // 3. Cross-reference

    // Dead keys: in JSON but NOT referenced in code at all
    const deadKeys = [];
    for (const jsonKey of allJsonKeys) {
        if (!usedKeys.has(jsonKey)) {
            deadKeys.push(jsonKey);
        }
    }

    // Missing keys: in code but NOT in JSON
    const missingKeys = [];
    for (const codeKey of usedKeys) {
        if (!allJsonKeys.has(codeKey)) {
            // Check if this is a namespace reference that has children 
            let hasChildren = false;
            for (const jsonKey of allJsonKeys) {
                if (jsonKey.startsWith(codeKey + '.')) {
                    hasChildren = true;
                    break;
                }
            }
            if (!hasChildren) {
                missingKeys.push(codeKey);
            }
        }
    }

    // 4. Report
    console.log('═══════════════════════════════════════════');
    console.log(`☠️  DEAD KEYS (in JSON, not in code): ${deadKeys.length}`);
    console.log(`❓ MISSING KEYS (in code, not in JSON): ${missingKeys.length}`);
    console.log(`⚡ DYNAMIC KEYS (need manual review): ${dynamicKeys.length}`);
    console.log('═══════════════════════════════════════════\n');

    // Group by namespace
    const deadByNamespace = {};
    for (const key of deadKeys) {
        const ns = key.split('.')[0];
        if (!deadByNamespace[ns]) deadByNamespace[ns] = [];
        deadByNamespace[ns].push(key);
    }

    const missingByNamespace = {};
    for (const key of missingKeys) {
        const ns = key.split('.')[0];
        if (!missingByNamespace[ns]) missingByNamespace[ns] = [];
        missingByNamespace[ns].push(key);
    }

    console.log('── Dead Keys by Namespace ──');
    for (const [ns, keys] of Object.entries(deadByNamespace).sort((a, b) => b[1].length - a[1].length)) {
        console.log(`  ${ns}: ${keys.length} dead keys`);
    }

    console.log('\n── Missing Keys by Namespace ──');
    if (Object.keys(missingByNamespace).length === 0) {
        console.log('  (none)');
    }
    for (const [ns, keys] of Object.entries(missingByNamespace).sort((a, b) => b[1].length - a[1].length)) {
        console.log(`  ${ns}: ${keys.length} missing keys`);
    }

    // 5. Write report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalJsonKeys: allJsonKeys.size,
            totalCodeKeys: usedKeys.size,
            deadKeys: deadKeys.length,
            missingKeys: missingKeys.length,
            dynamicKeys: dynamicKeys.length,
            esKeys: Object.keys(flatEs).length,
            enKeys: Object.keys(flatEn).length,
        },
        deadByNamespace,
        missingByNamespace,
        deadKeys: deadKeys.sort(),
        missingKeys: missingKeys.sort(),
        dynamicKeys,
        namespaceUsages: Object.fromEntries(namespaceUsages),
    };

    const reportPath = path.join(process.cwd(), 'scripts', 'i18n-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n📊 Full report written to: ${reportPath}`);
}

main();
