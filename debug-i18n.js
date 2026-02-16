
const { TranslationService } = require('./src/lib/translation-service');

async function run() {
    try {
        console.log("--- Starting Debug ---");
        const key = 'admin.knowledge.actions.upload';
        const locale = 'es';

        console.log(`Fetching detailed messages for ${locale}...`);
        const messages = await TranslationService.getDetailedMessages(locale);

        const entry = messages[key];

        console.log(`\nEntry for '${key}':`);
        console.log(JSON.stringify(entry, null, 2));

        if (!entry) {
            console.error("❌ Key not found!");
        } else {
            console.log("✅ Key found.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
