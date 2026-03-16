import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB, connectLogsDB } from '../src/lib/db';
import { ObjectId } from 'mongodb';

async function diagnose() {
    const db = await connectDB();
    const logsDb = await connectLogsDB();
    
    console.log('--- Recent Knowledge Assets (Failed) ---');
    const failedAssets = await db.collection('knowledge_assets').find({
        status: 'ERROR'
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    for (const a of failedAssets) {
        console.log(`[${a._id}] Status: ${a.status} (${a.ingestionStatus}) - File: ${a.source?.filename}`);
        console.log(`  BlobId: ${a.blobId}, StorageKey: ${a.source?.storageKey}`);
        
        // Check if blob exists
        const bId = a.blobId || a.source?.storageKey;
        if (bId) {
            try {
                const count = await db.collection('ingestion_blobs.files').countDocuments({ _id: new ObjectId(bId) });
                console.log(`  GridFS File Count: ${count}`);
            } catch (e) {
                console.log(`  GridFS Check Error: ${e.message}`);
            }
        }
    }
    
    console.log('\n--- Recent Ingest ERROR Logs (LOGS Cluster) ---');
    const logs = await logsDb.collection('application_logs').find({
        source: 'INGEST',
        level: 'ERROR'
    }).sort({ timestamp: -1 }).limit(10).toArray();
    
    logs.forEach(l => {
        console.log(`[${l.timestamp}] ${l.action} - ${l.message}`);
        console.log(`  Details: ${JSON.stringify(l.details)}`);
    });
    
    process.exit(0);
}

diagnose().catch(console.error);
