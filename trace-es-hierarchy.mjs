import fs from 'fs';
import path from 'path';

const esPath = path.join(process.cwd(), 'messages', 'es.json');
const content = fs.readFileSync(esPath, 'utf8');
const lines = content.split('\n');

console.log('Hierarchy of es.json (line number + key + depth):');
let stack = [];
lines.forEach((line, index) => {
    const match = line.match(/^(\s*)"([^"]+)": \{/);
    if (match) {
        const depth = match[1].length;
        const key = match[2];
        console.log(`${index + 1}: ${' '.repeat(depth)}${key}`);
    }
    if (line.match(/^\s*\}/)) {
        // Closing brace, but it's hard to track depth without a real parser
    }
});
