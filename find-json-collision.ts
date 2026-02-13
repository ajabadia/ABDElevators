import fs from 'fs';
import path from 'path';

function findCollisions(obj, prefix = '') {
    const collisions = [];
    const keys = Object.keys(obj);

    for (const key of keys) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];

        if (typeof val === 'object' && val !== null) {
            // Es un objeto (branch)
            findCollisions(val, fullKey).forEach(c => collisions.push(c));
        } else {
            // Es un leaf node (string)
            // Comprobar si existe como branch en el mismo nivel (no posible en JSON)
        }
    }
    return collisions;
}

// Escaneo manual específico para 'common.spaces'
const es = JSON.parse(fs.readFileSync('messages/es.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

console.log('--- ES.JSON ---');
console.log('common.spaces type:', typeof es.common?.spaces);
if (typeof es.common?.spaces === 'string') {
    console.log('🚨 common.spaces es un STRING:', es.common.spaces);
}
if (es.spaces) {
    console.log('🚨 root.spaces existe:', typeof es.spaces);
}

console.log('\n--- EN.JSON ---');
console.log('common.spaces type:', typeof en.common?.spaces);
if (typeof en.common?.spaces === 'string') {
    console.log('🚨 common.spaces es un STRING:', en.common.spaces);
}
if (en.spaces) {
    console.log('🚨 root.spaces existe:', typeof en.spaces);
}
