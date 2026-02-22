
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function cleanup() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();

        console.log('--- DB CLEANUP START ---');

        // Delete all knowledge assets
        const assetsResult = await db.collection('knowledge_assets').deleteMany({});
        console.log(`Deleted ${assetsResult.deletedCount} knowledge assets.`);

        // Delete all document chunks
        const chunksResult = await db.collection('document_chunks').deleteMany({});
        console.log(`Deleted ${chunksResult.deletedCount} document chunks.`);

        // Delete audit logs related to ingestion
        const auditResult = await db.collection('audit_ingestion').deleteMany({});
        console.log(`Deleted ${auditResult.deletedCount} audit records.`);

        console.log('--- DB CLEANUP COMPLETE ---');
    } finally {
        await client.close();
    }
}

cleanup().catch(console.error);
