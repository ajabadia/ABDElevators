import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnose() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('=== INGESTION STATE DIAGNOSTICS ===\n');

        // 1. Check knowledge_assets state
        console.log('1. KNOWLEDGE ASSETS:');
        const assets = await db.collection('knowledge_assets').find({}).sort({ createdAt: -1 }).limit(5).toArray();
        for (const asset of assets) {
            console.log(`  ID: ${asset._id}`);
            console.log(`  Filename: ${asset.filename}`);
            console.log(`  Status: ${asset.ingestionStatus}`);
            console.log(`  MD5: ${asset.fileMd5}`);
            console.log(`  CloudinaryURL: ${asset.cloudinaryUrl || 'NULL'}`);
            console.log(`  PublicID: ${asset.cloudinaryPublicId || 'NULL'}`);
            console.log(`  Environment: ${asset.environment}`);
            console.log(`  TenantId: ${asset.tenantId}`);
            console.log(`  Industry: ${asset.industry}`);
            console.log(`  Error: ${asset.error || 'NONE'}`);
            console.log(`  CorrelationId: ${asset.correlationId || 'NONE'}`);
            console.log('  ---');
        }

        // 2. Check file_blobs consistency
        console.log('\n2. FILE BLOBS:');
        const blobs = await db.collection('file_blobs').find({}).sort({ createdAt: -1 }).limit(5).toArray();
        for (const blob of blobs) {
            console.log(`  MD5: ${blob._id}`);
            console.log(`  CloudinaryURL: ${blob.cloudinaryUrl || 'NULL'}`);
            console.log(`  PublicID: ${blob.cloudinaryPublicId || 'NULL'}`);
            console.log(`  RefCount: ${blob.refCount || 0}`);
            console.log(`  Created: ${blob.createdAt}`);
            console.log('  ---');
        }

        // 3. Check recent errors
        console.log('\n3. RECENT ERRORS:');
        const errors = await db.collection('logs').find({
            level: 'ERROR',
            source: { $in: ['INGEST_PREPARER', 'INGEST_SERVICE', 'INGEST_WORKER', 'BLOB_MANAGER'] }
        }).sort({ timestamp: -1 }).limit(5).toArray();
        for (const err of errors) {
            console.log(`  Source: ${err.source}`);
            console.log(`  Action: ${err.action}`);
            console.log(`  Message: ${err.message}`);
            console.log(`  CorrelationId: ${err.correlationId || 'NONE'}`);
            console.log(`  Time: ${err.timestamp}`);
            console.log('  ---');
        }

        // 4. Check audit_ingestion
        console.log('\n4. AUDIT INGESTION:');
        const audits = await db.collection('audit_ingestion').find({}).sort({ createdAt: -1 }).limit(5).toArray();
        for (const audit of audits) {
            console.log(`  AssetId: ${audit.assetId}`);
            console.log(`  Status: ${audit.status}`);
            console.log(`  Phase: ${audit.phase}`);
            console.log(`  CorrelationId: ${audit.correlationId || 'NONE'}`);
            console.log(`  Created: ${audit.createdAt}`);
            console.log('  ---');
        }

        // 5. Check document_chunks
        console.log('\n5. DOCUMENT CHUNKS:');
        const chunksCount = await db.collection('document_chunks').countDocuments({});
        console.log(`  Total chunks: ${chunksCount}`);
        if (chunksCount > 0) {
            const sampleChunk = await db.collection('document_chunks').findOne({});
            console.log(`  Sample chunk environment: ${sampleChunk?.environment}`);
            console.log(`  Sample chunk tenantId: ${sampleChunk?.tenantId}`);
            console.log(`  Sample chunk industry: ${sampleChunk?.industry}`);
            console.log(`  Has embedding_multilingual: ${!!sampleChunk?.embedding_multilingual}`);
        }

        // 6. Check environment variable
        console.log('\n6. ENVIRONMENT CONFIG:');
        console.log(`  ENABLE_LOCAL_EMBEDDINGS: ${process.env.ENABLE_LOCAL_EMBEDDINGS || 'NOT SET'}`);

    } catch (error) {
        console.error('DIAGNOSTIC ERROR:', error);
    } finally {
        await client.close();
    }
}

diagnose();
