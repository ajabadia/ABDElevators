const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.resolve(__dirname, '../../messages');

/**
 * Fixes double UTF-8 encoding (mojibake).
 * e.g., "Ã³" -> "ó"
 */
function fixMojibake(str) {
    if (typeof str !== 'string') return str;

    // Manual fallback for very specific or triple encoded cases
    const map = {
        'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
        'Ã±': 'ñ', 'Ã³n': 'ón',
        'Ã\x81': 'Á', 'Ã\x89': 'É', 'Ã\x8d': 'Í', 'Ã\x93': 'Ó', 'Ã\x9a': 'Ú', 'Ã\x91': 'Ñ',
        'Â¿': '¿', 'Â¡': '¡', 'Â': '',
        'â†’': '→',
        'Ã\xa9': 'é', 'Ã\xb3': 'ó', 'Ã\xb1': 'ñ', 'Ã\xad': 'í', 'Ã\xa1': 'á', 'Ã\xba': 'ú',
        'ðŸ›¡ï¸ ': '🛡️', 'ðŸ§ ': '🧠', 'ðŸ¤–': '🤖', 'ðŸ¤': '👤'
    };

    let fixed = str;
    for (const [key, value] of Object.entries(map)) {
        fixed = fixed.split(key).join(value);
    }

    // Automatic recovery attempt for standard UTF-8 double encoding
    if (/[ÃÂâ]/.test(fixed)) {
        try {
            const buf = Buffer.from(fixed, 'binary');
            const decoded = buf.toString('utf8');
            // If decoded looks better (no unexpected symbols), use it
            if (decoded !== fixed && !decoded.includes('\ufffd') && decoded.length < fixed.length) {
                return decoded;
            }
        } catch (e) { }
    }

    return fixed;
}

/**
 * Detects if a string is Spanish or English.
 * Simple heuristic: check for common Spanish words or characters.
 */
function isSpanish(str) {
    if (!str || typeof str !== 'string') return false;
    // Common Spanish words that don't exist in English or are very specific
    const spanishIndicators = /[áéíóúñ¡¿]/i;
    const commonSpanishWords = /\b(el|la|los|las|un|una|con|por|para|esta|desde|hacia|entre|pedidos|gestión|análisis|visión|configuración|éxito|consumo|facturación|acceso)\b/i;
    return spanishIndicators.test(str.toLowerCase()) || commonSpanishWords.test(str.toLowerCase());
}

function processObject(obj) {
    const newObj = {};
    for (const key in obj) {
        let value = obj[key];
        if (typeof value === 'object' && value !== null) {
            newObj[key] = processObject(value);
        } else if (typeof value === 'string') {
            newObj[key] = fixMojibake(value);
        } else {
            newObj[key] = value;
        }
    }
    return newObj;
}

/**
 * Syncs EN and ES objects.
 * 1. If ES is empty and EN is Spanish -> swap.
 * 2. If EN is Spanish and identical to ES -> mark EN for translation.
 */
function syncObjects(enObj, esObj) {
    const emptyMarkers = ['', 'vacio', 'vacío', 'faltante', 'missing', 'vacio (auto-sync)', 'tbd', '[pending_translation]'];

    for (const key in enObj) {
        const enVal = enObj[key];
        const esVal = esObj[key];

        if (typeof enVal === 'object' && enVal !== null && esVal && typeof esVal === 'object') {
            syncObjects(enVal, esVal);
        } else if (typeof enVal === 'string' && (typeof esVal === 'string' || esVal === undefined)) {
            const currentEsVal = esVal || '';
            const isEsEmpty = emptyMarkers.includes(currentEsVal.toLowerCase().trim());
            const isEnSpanish = isSpanish(enVal);

            // Case 1: EN has Spanish text and ES is empty
            if (isEsEmpty && isEnSpanish) {
                console.log(`[SWAP] Moving Spanish text from EN to ES for key: ${key}`);
                esObj[key] = enVal;
                enObj[key] = '[PENDING_TRANSLATION]';
            }
            // Case 2: EN and ES both have Spanish text (duplicate)
            else if (isEnSpanish && enVal.trim() === currentEsVal.trim()) {
                console.log(`[CLEAN] Removing duplicate Spanish text from EN for key: ${key}`);
                enObj[key] = '[PENDING_TRANSLATION]';
            }
        }
    }
}

function cleanFiles() {
    const files = fs.readdirSync(path.join(MESSAGES_DIR, 'es'));

    files.forEach(file => {
        if (!file.endsWith('.json')) return;

        const esPath = path.join(MESSAGES_DIR, 'es', file);
        const enPath = path.join(MESSAGES_DIR, 'en', file);

        if (!fs.existsSync(enPath)) {
            console.warn(`[WARN] Missing EN counterpart for ${file}`);
            return;
        }

        let esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
        let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

        console.log(`[PROCESS] ${file}...`);

        // 1. Fix Mojibake in both
        esData = processObject(esData);
        enData = processObject(enData);

        // 2. Cross-sync language contamination
        syncObjects(enData, esData);

        // 3. Save back
        fs.writeFileSync(esPath, JSON.stringify(esData, null, 2), 'utf8');
        fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
    });

    console.log('✓ All i18n files sanitized and synced.');
}

cleanFiles();
