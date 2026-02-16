import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
const tenantId = 'platform_master';

async function verify() {
    if (!uri) {
        console.error('MONGODB_URI no definida');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const translations = db.collection('translations');
        const prompts = db.collection('prompts');

        console.log('--- Verificando i18n keys ---');
        const keys = [
            'admin.i18n.notifications.saveSuccess',
            'admin.i18n.notifications.syncSuccess',
            'admin.i18n.notifications.syncSuccessDesc'
        ];

        for (const key of keys) {
            const es = await translations.findOne({ key, locale: 'es', tenantId });
            const en = await translations.findOne({ key, locale: 'en', tenantId });
            console.log(`Key: ${key}`);
            console.log(`  ES: ${es ? es.value : 'MISSING'}`);
            console.log(`  EN: ${en ? en.value : 'MISSING'}`);
        }

        console.log('\n--- Verificando Prompt Variables ---');
        const prompt = await prompts.findOne({ key: 'I18N_AUTO_TRANSLATE', tenantId });
        if (prompt) {
            console.log(`Prompt: ${prompt.key}`);
            console.log(`Variables: ${JSON.stringify(prompt.variables, null, 2)}`);
            console.log(`Model: ${prompt.model}`);
        } else {
            console.log('Prompt I18N_AUTO_TRANSLATE not found');
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await client.close();
    }
}

verify();
