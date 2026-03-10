import path from 'node:path';
import { getMongoClient, connectConfigDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkTestTranslations() {
    try {
        console.log('--- CHECKING TEST TRANSLATIONS ---');
        const client = await getMongoClient();
        const configDb = await connectConfigDB();

        const testCol = client.db('test').collection('translations');
        const targetCol = configDb.collection('translations');

        const testDocs = await testCol.find({}).toArray();
        console.log(`Found ${testDocs.length} docs in [test].`);

        for (const doc of testDocs) {
            const exists = await targetCol.findOne({ key: doc.key, locale: doc.locale });
            console.log(`Key: [${doc.locale}] ${doc.key} -> ${exists ? '✅ MATCH' : '❌ MISSING'}`);
        }

        await client.close();
        await configDb.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

checkTestTranslations();
