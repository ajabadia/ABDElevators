const fs = require('fs');
const logContent = fs.readFileSync('tsc_errors_crypto_fixed.txt', 'utf8');

const lines = logContent.split(/\r?\n/);
const filesToFix = new Set();

for (const line of lines) {
    if (line.includes("does not exist on type 'Crypto'")) {
        // Line format: src/app/api/.../route.ts(12,34): error TS2339...
        const match = line.match(/^(.+?\.tsx?)\(/);
        if (match) {
            filesToFix.add(match[1].replace(/\//g, '\\'));
        }
    }
}

console.log(`Found ${filesToFix.size} files that need 'crypto' restored.`);

for (const file of filesToFix) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        if (!content.includes("import crypto from 'crypto'")) {
            content = "import crypto from 'crypto';\n" + content;
            fs.writeFileSync(file, content);
            console.log(`Restored crypto in: ${file}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
}
