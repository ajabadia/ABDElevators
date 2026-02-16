const fs = require('fs');
const path = require('path');

const SCAN_DIR = 'src';
const TARGET = 'workshop.orders.new.title';

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(TARGET)) {
                console.log(`FOUND in ${fullPath}`);
            }
        }
    }
}

walk(SCAN_DIR);
