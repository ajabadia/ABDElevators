const fs = require('fs');
const path = require('path');

const filePath = 'd:/desarrollos/ABDElevators/messages/es/admin.json';
const content = fs.readFileSync(filePath, 'utf8');

try {
    // 1. Attempt to fix the trailing structure
    let fixedContent = content.trim();
    if (fixedContent.endsWith('}}}')) {
        fixedContent = fixedContent.slice(0, -1);
    }

    // 2. Try parsing
    let data;
    try {
        data = JSON.parse(fixedContent);
    } catch (e) {
        // If it still fails, try to find where it's broken
        console.error('Initial parse failed, attempting deep fix...');
        // Match the last valid closing brace
        const lastBraceIndex = fixedContent.lastIndexOf('}');
        fixedContent = fixedContent.substring(0, lastBraceIndex + 1);
        data = JSON.parse(fixedContent);
    }

    // 3. Resolve internal duplicates (if any) and standardize
    // The parser handles duplicates by keeping the last one.
    // We'll write it back with proper formatting.
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Successfully repaired and standardized admin.json');
} catch (error) {
    console.error('Critical failure repairing JSON:', error.message);
    process.exit(1);
}
