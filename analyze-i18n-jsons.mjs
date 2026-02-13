import fs from 'fs';
import path from 'path';

function analyze(filePath) {
    console.log(`--- Root Keys in ${path.basename(filePath)} ---`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        if (line.match(/^    "[a-zA-Z0-9_]+": \{/)) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
        }
    });

    console.log(`\n--- Searching for "spaces" and "security" in ${path.basename(filePath)} ---`);
    lines.forEach((line, index) => {
        if (line.includes('"spaces":') || line.includes('"security":')) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
        }
    });
    console.log('\n');
}

analyze(path.join(process.cwd(), 'messages', 'es.json'));
analyze(path.join(process.cwd(), 'messages', 'en.json'));
