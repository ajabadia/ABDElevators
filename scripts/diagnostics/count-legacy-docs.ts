
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

        const legacyCollections = [
            'documentos',
            'documentos_usuarios',
            'tipos_documento',
            'taxonomias',
            'documentos_tecnicos' // just in case
        ];

        console.log('--- LEGACY COLLECTION COUNTS (MAIN DB) ---');
        for (const colName of legacyCollections) {
            try {
                const count = await db.collection(colName).countDocuments();
                console.log(`${colName}: ${count} documents`);
                if (count > 0) {
                    const sample = await db.collection(colName).findOne();
                    console.log(`   Sample keys: ${Object.keys(sample || {}).join(', ')}`);
                }
            } catch (e) {
                console.log(`${colName}: collection not found or error`);
            }
        }
    } finally {
        await client.close();
    }
}

run();
