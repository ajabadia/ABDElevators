
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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

        const results: Record<string, any> = {};
        for (const colName of newCollections) {
            try {
                const count = await db.collection(colName).countDocuments();
                results[colName] = count;
            } catch (e) {
                results[colName] = 'Not found';
            }
        }

        fs.writeFileSync('new_counts.json', JSON.stringify(results, null, 2));
        console.log('Results saved to new_counts.json');
    } finally {
        await client.close();
    }
}

run();
