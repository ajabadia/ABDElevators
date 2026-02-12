const fs = require('fs');
const path = require('path');

function validateJson(filePath) {
    console.log(`Validating ${filePath}...`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);
        console.log(`✅ ${filePath} is a valid JSON.`);

        // Check for specific path
        if (json.admin && json.admin.billing && json.admin.billing.contracts) {
            console.log(`✅ Path admin.billing.contracts found in ${filePath}`);
            console.log('Keys:', Object.keys(json.admin.billing.contracts));
        } else {
            console.log(`❌ Path admin.billing.contracts NOT found in ${filePath}`);
            if (!json.admin) console.log('   - admin missing');
            else if (!json.admin.billing) console.log('   - admin.billing missing');
            else if (!json.admin.billing.contracts) console.log('   - admin.billing.contracts missing');
        }
    } catch (e) {
        console.error(`❌ Error parsing ${filePath}:`, e.message);
    }
}

validateJson(path.join('messages', 'es.json'));
validateJson(path.join('messages', 'en.json'));
