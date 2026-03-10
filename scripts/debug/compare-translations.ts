import path from 'node:path';
import { getMongoClient, connectConfigDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function compareTranslations() {
    try {
        console.log('--- COMPARING TRANSLATIONS ---');
        const client = await getMongoClient();
        const configDb = await connectConfigDB();

        const sourceDb = client.db('abd-rag-ascensores');
        const sourceCol = sourceDb.collection('translations');
        const targetCol = configDb.collection('translations');

        const sourceCount = await sourceCol.countDocuments();
        const targetCount = await targetCol.countDocuments();

        console.log(`- Source (abd-rag-ascensores): ${sourceCount} docs`);
        console.log(`- Target (Config DB): ${targetCount} docs`);

        // Verificar si algunos IDs de Slugs existen en el destino
        const sourceSamples = await sourceCol.find({}).limit(5).toArray();
        console.log('\n--- Sample Keys in Source ---');
        for (const s of sourceSamples) {
            const exists = await targetCol.findOne({ key: s.key, locale: s.locale });
            console.log(`Key: [${s.locale}] ${s.key} -> ${exists ? '✅ Exists in CONFIG' : '❌ MISSING in CONFIG'}`);
        }

        await client.close();
        await configDb.client.close();
    } catch (error: any) {
        console.error('❌ Error during comparison:', error.message);
    }
}

compareTranslations();
