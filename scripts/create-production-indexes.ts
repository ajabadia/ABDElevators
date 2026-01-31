import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectDB, connectLogsDB } from "../src/lib/db";

async function createProductionIndexes() {
    console.log('🚀 [PHASE 31] Creating Production Critical Indexes...');

    try {
        const db = await connectDB();
        const logsDb = await connectLogsDB();

        // 1. Entities (Unified Collection)
        const entities = db.collection('entities');
        await entities.createIndex({ tenantId: 1, createdAt: -1 });
        await entities.createIndex({ tenantId: 1, md5Hash: 1 });
        await entities.createIndex({ identifier: "text", filename: "text" }); // Full-text search
        console.log('✅ Entities indexes created.');

        // 2. Generic Cases
        const cases = db.collection('cases');
        await cases.createIndex({ tenantId: 1, 'metadata.sourceId': 1 });
        await cases.createIndex({ tenantId: 1, status: 1 });
        console.log('✅ Generic Cases indexes created.');

        // 3. User Accounts (Identity Suite)
        // Note: Already handled by Mongoose unique: true, but manual safety check
        console.log('ℹ️ Identity indexes managed by Mongoose/AuthDB.');

        // 4. Logs & Observability
        const logs = logsDb.collection('logs');
        await logs.createIndex({ correlationId: 1 });
        await logs.createIndex({ tenantId: 1, createdAt: -1 });
        await logs.createIndex({ level: 1, source: 1 });
        console.log('✅ Observability logs indexes created.');

        // 5. Usage Stats
        const usage = logsDb.collection('usage_logs');
        await usage.createIndex({ tenantId: 1, timestamp: -1 });
        console.log('✅ Usage logs indexes created.');

        console.log('🏆 All Phase 31 indexes applied successfully.');
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
    }
    process.exit(0);
}

createProductionIndexes();
