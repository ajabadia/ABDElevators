const fs = require('fs');

function nestToFlat(obj, prefix = '') {
    const result = {};
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

const monolith = JSON.parse(fs.readFileSync('messages/es.json', 'utf8'));
const flat = nestToFlat(monolith);
console.log(Object.keys(flat).slice(0, 10));
console.log('---');
console.log('workshop.orders.new.title' in flat);
console.log(flat['workshop.orders.new.title']);
