import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function inspect() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collection = db.collection('i18n_translations');

        const keysToInspect = [
            'admin.knowledge.actions.upload',
            'admin.knowledge.assets.actions.delete',
            'admin.knowledge.assets.actions.retry'
        ];

        console.log('\n--- 🔍 Inspección de llaves i18n ---');

        for (const key of keysToInspect) {
            const docs = await collection.find({ key }).toArray();
            console.log(`\nLlave: ${key}`);
            if (docs.length === 0) {
                console.log('  ❌ No encontrada en DB');
            } else {
                docs.forEach(doc => {
                    console.log(`  - [${doc.tenantId}] [${doc.locale}] Value: "${doc.value}" (Namespace: ${doc.namespace})`);
                });
            }
        }

    } finally {
        await client.close();
    }
}

inspect();
