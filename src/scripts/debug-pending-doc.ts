import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function main() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        
        // Broad search
        console.log('Searching for any asset with 0288702916 in any field...');
        const docs = await db.collection('knowledge_assets').find({}).toArray();
        const doc = docs.find(d => JSON.stringify(d).includes('0288702916'));
        
        if (!doc) {
            console.log('Document NOT found even with broad search. Last 3 documents in DB:');
            const last3 = await db.collection('knowledge_assets').find({}).sort({ createdAt: -1 }).limit(3).toArray();
            last3.forEach(d => console.log(JSON.stringify(d, null, 2)));
            return;
        }

        console.log('Document found:', JSON.stringify(doc, null, 2));
        
        console.log('\n--- Checking for Fragments ---');
        const fragmentCount = await db.collection('document_chunks').countDocuments({
            assetId: doc._id
        });
        console.log(`Fragment count in document_chunks: ${fragmentCount}`);

        console.log('\n--- Related Logs ---');
        const logs = await db.collection('event_logs').find({
            $or: [
                { correlationId: doc.correlationId },
                { 'details.documentId': doc._id.toString() },
                { 'details.entityId': doc._id.toString() },
                { 'details.assetId': doc._id.toString() },
                { message: { $regex: '0288702916', $options: 'i' } }
            ]
        }).sort({ timestamp: -1 }).limit(50).toArray();
        
        logs.forEach(l => {
            console.log(`[${l.timestamp?.toISOString()}] [${l.level}] [${l.action}] ${l.message}`);
            if (l.details) console.log('Details:', JSON.stringify(l.details));
        });
    } finally {
        await client.close();
    }
}

main().catch(console.error);
