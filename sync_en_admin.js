const fs = require('fs');

const esPath = 'd:/desarrollos/ABDElevators/messages/es/admin.json';
const enPath = 'd:/desarrollos/ABDElevators/messages/en/admin.json';

const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Helper to deep sync keys
function syncKeys(source, target) {
    for (const key in source) {
        if (typeof source[key] === 'object' && source[key] !== null) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            syncKeys(source[key], target[key]);
        } else {
            if (!target[key]) {
                target[key] = source[key]; // Copy ES value as fallback
            }
        }
    }
}

syncKeys(esData, enData);

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
console.log('SYNC_SUCCESS');
