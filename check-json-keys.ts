import fs from 'fs';

function getFlatKeys(obj, prefix = '') {
    let keys = {};
    for (const k in obj) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(keys, getFlatKeys(obj[k], fullKey));
        } else {
            keys[fullKey] = obj[k];
        }
    }
    return keys;
}

// Verificar ES
const es = JSON.parse(fs.readFileSync('messages/es.json', 'utf8'));
const esFlat = getFlatKeys(es);
const esKeys = Object.keys(esFlat);

console.log('--- ES.JSON ---');
console.log('Total keys:', esKeys.length);
console.log('common.spaces exists as leaf:', esKeys.includes('common.spaces'));
if (esKeys.includes('common.spaces')) {
    console.log('Value:', esFlat['common.spaces']);
}

const spacesChildrenEs = esKeys.filter(k => k.startsWith('common.spaces.'));
console.log('common.spaces.* count:', spacesChildrenEs.length);

// Verificar EN
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const enFlat = getFlatKeys(en);
const enKeys = Object.keys(enFlat);

console.log('\n--- EN.JSON ---');
console.log('Total keys:', enKeys.length);
console.log('common.spaces exists as leaf:', enKeys.includes('common.spaces'));
if (enKeys.includes('common.spaces')) {
    console.log('Value:', enFlat['common.spaces']);
}

const spacesChildrenEn = enKeys.filter(k => k.startsWith('common.spaces.'));
console.log('common.spaces.* count:', spacesChildrenEn.length);
