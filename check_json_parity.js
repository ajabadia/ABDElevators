const fs = require('fs');
const path = require('path');

const esDir = path.join(__dirname, 'messages/es');
const enDir = path.join(__dirname, 'messages/en');

function getKeys(obj, prefix = '') {
    let keys = [];
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            keys = keys.concat(getKeys(value, `${prefix}${key}.`));
        } else {
            keys.push(`${prefix}${key}`);
        }
    }
    return keys;
}

const targetNamespaces = [
    'admin.audit',
    'admin.governance',
    'admin.compliance',
    'common.navigation',
    'common.breadcrumbs'
];

let missingAny = false;

for (const file of ['admin.json', 'common.json']) {
    const esObj = JSON.parse(fs.readFileSync(path.join(esDir, file), 'utf8'));
    const enObj = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf8'));

    const esKeys = getKeys(esObj);
    const enKeys = getKeys(enObj);

    const esSet = new Set(esKeys);
    const enSet = new Set(enKeys);

    // Filter by our namespaces
    const esRelevant = [...esSet].filter(k => targetNamespaces.some(ns => `${file.replace('.json', '')}.${k}`.startsWith(ns)));

    const missingInEn = esRelevant.filter(k => !enSet.has(k));

    if (missingInEn.length > 0) {
        console.log(`[!] ${file} is missing requested keys in EN:`);
        console.log(missingInEn.map(k => "  " + k).join("\n"));
        missingAny = true;
    }
}

if (!missingAny) {
    console.log("No missing keys detected in targeted namespaces! Perfect parity.");
}
