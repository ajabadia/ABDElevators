const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Remove the import crypto line completely
            content = content.replace(/import\s+crypto\s+from\s+['"]crypto['"];?\r?\n?/g, '');
            // Also Node-style import if present
            content = content.replace(/import\s+crypto\s+from\s+['"]node:crypto['"];?\r?\n?/g, '');
            // Remove single quotes version
            content = content.replace(/import\s+crypto\s+from\s+['"]crypto['"]\s*;?\r?\n?/g, '');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`Removed crypto import from: ${fullPath}`);
            }
        }
    });
}

processDir(path.join(__dirname, 'src/app/api'));
processDir(path.join(__dirname, 'src/lib'));
processDir(path.join(__dirname, 'src/services'));
