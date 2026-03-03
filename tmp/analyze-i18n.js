
import fs from 'fs';
import path from 'path';

function flatten(obj, prefix = '') {
    let res = {};
    for (let [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(res, flatten(value, fullKey));
        } else {
            res[fullKey] = value;
        }
    }
    return res;
}

const baseDir = './messages/es';
const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.json'));

const fileKeys = {};
const allKeys = {};

for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(baseDir, file), 'utf8'));
    const flat = flatten(content);
    fileKeys[file] = Object.keys(flat);

    for (const key of Object.keys(flat)) {
        if (!allKeys[key]) allKeys[key] = [];
        allKeys[key].push(file);
    }
}

let output = '';

output += '--- TOP LEVEL KEYS OF admin.json ---\n';
const adminContent = JSON.parse(fs.readFileSync(path.join(baseDir, 'admin.json'), 'utf8'));
output += Object.keys(adminContent).join(', ') + '\n\n';

output += '--- DUPLICATE KEYS ACROSS FILES ---\n';
for (const [key, files] of Object.entries(allKeys)) {
    if (files.length > 1) {
        if (files.includes('admin.json')) {
            output += `Key "${key}" found in: ${files.join(', ')}\n`;
        }
    }
}

output += '\n--- FILE STATS ---\n';
for (const [file, keys] of Object.entries(fileKeys)) {
    output += `${file}: ${keys.length} keys\n`;
}

fs.writeFileSync('./tmp/i18n-audit.txt', output);
