
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkDiagnostics() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        
        const asset = await db.collection('knowledge_assets').findOne({}, { sort: { createdAt: -1 } });
        console.log('--- Last Asset Info ---');
        console.log(JSON.stringify(asset, null, 2));

        if (asset) {
            const assetId = asset._id;
            const assetIdStr = assetId.toString();

            const links = await db.collection('asset_space_links').find({ assetId: assetId }).toArray();
            console.log('--- Space Links (by ObjectId) ---');
            console.log(JSON.stringify(links, null, 2));

            const linksStr = await db.collection('asset_space_links').find({ assetId: assetIdStr }).toArray();
            console.log('--- Space Links (by String ID) ---');
            console.log(JSON.stringify(linksStr, null, 2));

            const audits = await db.collection('audit_ingestion').find({ docId: assetIdStr }).toArray();
            console.log('--- Audit Logs ---');
            console.log(JSON.stringify(audits, null, 2));
            
            // Also check for any general errors in audit
            const lastErrorAudit = await db.collection('audit_ingestion').findOne({ status: 'FAILED' }, { sort: { timestamp: -1 } });
            console.log('--- Last Failed Audit (any) ---');
            console.log(JSON.stringify(lastErrorAudit, null, 2));
        }

        // Check if there are ANY documents in doc_chunks (to see if indexing started)
        const chunkCount = await db.collection('document_chunks').countDocuments();
        console.log(`\nTotal Chunks in DB: ${chunkCount}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.close();
    }
}

checkDiagnostics();
