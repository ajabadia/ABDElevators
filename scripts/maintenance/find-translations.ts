
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function findTranslations() {
    const uri = process.env.MONGODB_CONFIG_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_CONFIG_URI or MONGODB_URI not found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        // Check all databases for 'translations'
        const dbList = await client.db().admin().listDatabases();
        console.log('--- Databases on Cluster ---');
        for (const dbInfo of dbList.databases) {
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            const translationCol = collections.find(c => c.name === 'translations');
            if (translationCol) {
                const count = await db.collection('translations').countDocuments();
                console.log(`FOUND 'translations' in DB: ${dbInfo.name} (${count} docs)`);
            }
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

findTranslations();
