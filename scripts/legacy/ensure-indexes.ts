import { connectDB, getMongoClient } from '../lib/db';
import { Collection } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function ensureIndexes() {
    console.log('🛡️ Starting Critical Index Verification...');

    try {
        const db = await connectDB();

        // 1. Knowledge Assets
        const assets: Collection = db.collection('knowledge_assets');
        console.log('Checking indexes for: knowledge_assets');

        await assets.createIndex({ tenant_id: 1, processingStatus: 1 }, { name: 'idx_tenant_status' });
        await assets.createIndex({ type: 1, created_at: -1 }, { name: 'idx_type_created' });

        console.log('✅ knowledge_assets indexes verified.');

        // 2. Document Chunks (Standard Indexes)
        const chunks: Collection = db.collection('document_chunks');
        console.log('Checking indexes for: document_chunks');

        // Critical for finding chunks by document/asset
        await chunks.createIndex({ knowledge_asset_id: 1 }, { name: 'idx_asset_id' });
        await chunks.createIndex({ document_id: 1, chunk_index: 1 }, { name: 'idx_doc_chunk_order' });

        console.log('✅ document_chunks indexes verified.');

        // 3. Webhook Idempotency
        const events = db.collection('processed_events');
        console.log('Checking indexes for: processed_events');
        await events.createIndex({ eventId: 1 }, { unique: true, name: 'idx_event_id_unique' });
        // TTL for events (keep for 48h for idempotency window)
        await events.createIndex({ createdAt: 1 }, { expireAfterSeconds: 172800, name: 'idx_events_ttl' });

        // 3b. Industrial Webhook Idempotency (FASE 84)
        const webhooks = db.collection('processed_webhooks');
        console.log('Checking indexes for: processed_webhooks');
        await webhooks.createIndex({ eventId: 1 }, { unique: true, name: 'idx_webhook_id_unique' });
        // TTL for webhooks (keep for 90 days as per FASE 84)
        await webhooks.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000, name: 'idx_webhooks_ttl' });

        // 4. Rate Limits
        const rates = db.collection('rate_limits');
        console.log('Checking indexes for: rate_limits');
        await rates.createIndex({ key: 1 }, { unique: true, name: 'idx_rate_key_unique' });
        // TTL for rate limits (expire after 'reset' field date passed)
        await rates.createIndex({ reset: 1 }, { expireAfterSeconds: 0, name: 'idx_rate_ttl' });

        // 5. User & Tenants (if not already handled)
        const users = db.collection('users');
        await users.createIndex({ email: 1 }, { unique: true, name: 'idx_email_unique' });

        console.log('✨ All critical indexes are ready.');
    } catch (error) {
        console.error('❌ Error ensuring indexes:', error);
        process.exit(1);
    } finally {
        // Force close connection just for this script
        try {
            const client = await getMongoClient();
            await client.close();
            console.log('🔌 Connection closed.');
        } catch (e) {
            console.log('⚠️ Could not close client:', e);
        }
    }
}

// Execute
ensureIndexes();
