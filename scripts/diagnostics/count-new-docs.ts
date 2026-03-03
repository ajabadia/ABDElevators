
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) return;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        const newCollections = [
            'document_types',
            'taxonomies',
            'user_documents',
            'knowledge_assets'
        ];

        console.log('--- NEW COLLECTION COUNTS (MAIN DB) ---');
        for (const colName of newCollections) {
            try {
                const count = await db.collection(colName).countDocuments();
                console.log(`${colName}: ${count} documents`);
            } catch (e) {
                console.log(`${colName}: collection not found or error`);
            }
        }
    } finally {
        await client.close();
    }
}

run();
