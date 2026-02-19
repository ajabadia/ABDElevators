const fs = require('fs');

function analyzeJson(filePath) {
    console.log(`Analyzing ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    const rootKeyRegex = /^  "([^"]+)": \{/i;
    const keyCounts = {};

    lines.forEach((line, i) => {
        const match = line.match(rootKeyRegex);
        if (match) {
            const key = match[1];
            if (!keyCounts[key]) keyCounts[key] = [];
            keyCounts[key].push(i + 1);
        }
    });

    Object.keys(keyCounts).forEach(key => {
        if (keyCounts[key].length > 1) {
            console.log(`DUPLICATE ROOT KEY: "${key}" at lines ${keyCounts[key].join(', ')}`);
        } else {
            // console.log(`Key: "${key}" at line ${keyCounts[key][0]}`);
        }
    });
}

analyzeJson('messages/es/admin.json');
console.log('---');
analyzeJson('messages/en/admin.json');
