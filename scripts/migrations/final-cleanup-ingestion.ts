
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanup() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('--- DEFINITIVE INGESTION CLEANUP START ---');

        // 1. Delete ALL Knowledge Assets to start from a clean slate
        const res1 = await db.collection('knowledge_assets').deleteMany({});
        console.log(`- Deleted ALL knowledge_assets: ${res1.deletedCount}`);

        // 2. Delete ALL File Blobs to force re-uploads and new naming structure
        const res2 = await db.collection('file_blobs').deleteMany({});
        console.log(`- Deleted ALL file_blobs: ${res2.deletedCount}`);

        // 3. Clear existing logs to make diagnostics clean
        const res3 = await db.collection('logs').deleteMany({
            source: { $in: ['INGEST_WORKER', 'API_PEDIDOS', 'INGEST_PREPARER', 'INGEST_SERVICE', 'INGEST_ANALYZER'] }
        });
        console.log(`- Cleared ${res3.deletedCount} ingestion-related logs.`);

        console.log('--- CLEANUP COMPLETE ---');
        console.log('The environment is now CLEAN. Please upload "Real Decreto..." again.');

    } catch (error) {
        console.error('CLEANUP ERROR:', error);
    } finally {
        await client.close();
    }
}

cleanup();
