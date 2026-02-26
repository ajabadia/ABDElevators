const fs = require('fs');

const filePath = 'd:/desarrollos/ABDElevators/messages/es/admin.json';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Force the end to be a single closing object } and the root }
// We match from the last occurrence of '"cache_inactive": "INACTIVA"'
const marker = '"cache_inactive": "INACTIVA"';
const markerIndex = content.lastIndexOf(marker);

if (markerIndex !== -1) {
    const startOfEnd = markerIndex + marker.length;
    let newContent = content.substring(0, startOfEnd) + '\r\n  }\r\n}';

    try {
        JSON.parse(newContent);
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('REPAIR_SUCCESS_BY_MARKER');
    } catch (e) {
        console.error('REPAIR_FAIL_BY_MARKER:', e.message);
        // Last resort: find the last occurrence of '"cache_inactive": "INACTIVA"' and just append what's missing
        // or try to find where the brackets are truly messed up.
    }
} else {
    console.error('MARKER_NOT_FOUND');
}
