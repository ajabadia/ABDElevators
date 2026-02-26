const fs = require('fs');
const path = require('path');

const filePath = 'd:/desarrollos/ABDElevators/messages/es/admin.json';
const content = fs.readFileSync(filePath, 'utf8');

try {
    // Standardize by parsing and re-stringifying
    // Duplicates are resolved automatically by keeping the last occurrence.
    const data = JSON.parse(content);
    const cleaned = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, cleaned, 'utf8');
    console.log('REPAIR_SUCCESS');
} catch (e) {
    if (e.message.includes('Unexpected token }')) {
        // Try trimming the last character if it's an extra bracket
        const trimmed = content.trim();
        if (trimmed.endsWith('}')) {
            try {
                const retryData = JSON.parse(trimmed.substring(0, trimmed.lastIndexOf('}') + 1));
                fs.writeFileSync(filePath, JSON.stringify(retryData, null, 2), 'utf8');
                console.log('REPAIR_SUCCESS_AFTER_TRIM');
                process.exit(0);
            } catch (ee) {
                console.error('FINAL_FAIL:', ee.message);
            }
        }
    }
    console.error('REPAIR_FAIL:', e.message);
    process.exit(1);
}
