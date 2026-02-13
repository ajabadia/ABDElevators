import fs from 'fs';
import path from 'path';

const enPath = path.join(process.cwd(), 'messages', 'en.json');
const content = fs.readFileSync(enPath, 'utf8');
const lines = content.split('\n');

console.log('Hierarchy of en.json (line number + key + depth):');
let stack = [];
lines.forEach((line, index) => {
    const match = line.match(/^(\s*)"([^"]+)": \{/);
    if (match) {
        const depth = match[1].length;
        const key = match[2];
        console.log(`${index + 1}: ${' '.repeat(depth)}${key}`);
    }
});
