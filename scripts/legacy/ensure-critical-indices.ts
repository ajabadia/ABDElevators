import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';

// Load env from root (assuming script run from project root)
dotenv.config({ path: '.env.local' });

async function ensureIndices() {
    console.log('--- Ensuring Critical Indices for Performance & Deduplication (Standalone) ---');

    // Minimal DB Connection Logic (Copied from lib/db.ts to avoid import issues)
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not defined in .env.local');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(); // Default DB
        // Assuming AuthDB is same or derived? 
        // In lib/db.ts: connectAuthDB usually connects to specific DB or same.
        // For this script we assume Same Client, likely same DB or we check ENV.
        // safe assumption for now if standard MONGODB_URI is used.

        // 1. Knowledge Assets (Main RAG Metadata)
        const kaCol = db.collection('knowledge_assets');

        // Tenant Lookups (Frequent)
        await kaCol.createIndex({ tenantId: 1, status: 1 }, { background: true });
        console.log('Index created: knowledge_assets { tenantId: 1, status: 1 }');

        // Deduplication (MD5)
        await kaCol.createIndex({ fileMd5: 1 }, { background: true });
        console.log('Index created: knowledge_assets { fileMd5: 1 }');

        // 2. Document Chunks (RAG Retrieval)
        const chunksCol = db.collection('document_chunks');

        // Retrieval filtering by Tenant + Doc (Deletion mainly)
        await chunksCol.createIndex({ tenantId: 1, sourceDoc: 1 }, { background: true });
        console.log('Index created: document_chunks { tenantId: 1, sourceDoc: 1 }');

        // 3. Usage Logs (Analytics)
        const usageCol = db.collection('usage_logs');

        // Dashboard Stats (time-based queries)
        await usageCol.createIndex({ tenantId: 1, timestamp: -1 }, { background: true });
        console.log('Index created: usage_logs { tenantId: 1, timestamp: -1 }');

        // 4. Application Logs (Admin Logs Page)
        // Check if logs are in separate DB?
        // Usually usage_logs and logs_aplicacion are in the main APP db in simple setups.
        // We will index them on the main 'db' handle.
        const logsCol = db.collection('application_logs');
        await logsCol.createIndex({ tenantId: 1, timestamp: -1 }, { background: true });
        console.log('Index created: application_logs { tenantId: 1, timestamp: -1 }');

        console.log('--- All Critical Indices Ensured ---');
    } catch (error) {
        console.error('Error creating indices:', error);
    } finally {
        await client.close();
    }
    process.exit(0);
}

ensureIndices();
