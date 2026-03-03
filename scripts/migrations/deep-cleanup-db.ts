
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function deepCleanup() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();

        // Target the correct DB found in diagnostics
        const dbName = 'ABDElevators';
        const db = client.db(dbName);

        console.log(`--- DEEP CLEANUP START (DB: ${dbName}) ---`);

        const coreCollections = [
            'knowledge_assets',
            'document_chunks',
            'audit_ingestion',
            'llm_costs',
            'fs.files',
            'fs.chunks'
        ];

        const userRequestedCollections = [
            'ingestion_blobs.files',
            'ingestion_blobs.chunks',
            'file_blobs',
            'pedidos',
            'user_documents'
        ];

        const allToClean = [...coreCollections, ...userRequestedCollections];

        for (const collName of allToClean) {
            try {
                const count = await db.collection(collName).countDocuments();
                if (count > 0) {
                    const result = await db.collection(collName).deleteMany({});
                    console.log(`[CLEANED] ${collName}: Deleted ${result.deletedCount} documents.`);
                } else {
                    console.log(`[SKIP] ${collName}: Already empty.`);
                }
            } catch (err) {
                console.log(`[WARN] ${collName}: Collection not found or error. Skipping.`);
            }
        }

        console.log('--- DEEP CLEANUP COMPLETE ---');
    } finally {
        await client.close();
    }
}

deepCleanup().catch(console.error);
