import fs from 'fs';
import path from 'path';

const esPath = path.join(process.cwd(), 'messages', 'es.json');
const content = fs.readFileSync(esPath, 'utf8');
const lines = content.split('\n');

console.log('--- Root Keys in es.json ---');
lines.forEach((line, index) => {
    if (line.match(/^    "[a-zA-Z0-9_]+": \{/)) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});

console.log('\n--- Searching for "spaces" and "security" ---');
lines.forEach((line, index) => {
    if (line.includes('"spaces":') || line.includes('"security":')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});
