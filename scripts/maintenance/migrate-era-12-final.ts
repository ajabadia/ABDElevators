
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateEra12Final() {
    console.log('🚀 Starting Final Phase 8 Migration (MAIN Audit Cleanup)...');

    const uris = {
        MAIN: process.env.MONGODB_URI,
        AUTH: process.env.MONGODB_AUTH_URI,
        CONFIG: process.env.MONGODB_CONFIG_URI,
        LOGS: process.env.MONGODB_LOGS_URI
    };

    const clients: Record<string, MongoClient> = {};
    for (const [key, uri] of Object.entries(uris)) {
        if (!uri) continue;
        clients[key] = new MongoClient(uri);
        await clients[key].connect();
    }

    const mainDb = clients.MAIN.db('ABDElevators');
    const authDb = clients.AUTH.db('ABDElevators-Auth');
    const configDb = clients.CONFIG.db('ABDElevators-Config');
    const logsDb = clients.LOGS.db('ABDElevators-Logs');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '').split('T')[0];

    async function moveCollection(sourceClient: MongoClient, sourceDbName: string, targetClient: MongoClient, targetDbName: string, colName: string) {
        const sourceDb = sourceClient.db(sourceDbName);
        const targetDb = targetClient.db(targetDbName);

        console.log(`📦 Moving [${colName}] from ${sourceDbName} to ${targetDbName}...`);
        
        const count = await sourceDb.collection(colName).countDocuments();
        if (count === 0) {
            const collections = await sourceDb.listCollections({ name: colName }).toArray();
            if (collections.length === 0) {
                console.log(`  ⚠️ Collection [${colName}] not found. Skipping.`);
                return;
            }
        }

        const documents = await sourceDb.collection(colName).find({}).toArray();
        if (documents.length > 0) {
            await targetDb.collection(colName).insertMany(documents as any);
            console.log(`  ✅ Inserted ${documents.length} docs into ${targetDbName}.`);
        }
        await sourceDb.collection(colName).drop();
        console.log(`  ✅ Dropped from ${sourceDbName}.`);
    }

    async function renameInDb(db: any, oldName: string, newName: string) {
        console.log(`✏️ Renaming [${oldName}] to [${newName}]...`);
        try {
            const collections = await db.listCollections({ name: oldName }).toArray();
            if (collections.length === 0) {
                console.log(`  ⚠️ Collection [${oldName}] not found. Skipping.`);
                return;
            }
            await db.collection(oldName).rename(newName);
            console.log(`  ✅ Success.`);
        } catch (e) {
            console.warn(`  ❌ Rename failed:`, e.message);
        }
    }

    // --- 1. RELOCATIONS (MAIN -> OTHERS) ---
    await moveCollection(clients.MAIN, 'ABDElevators', clients.AUTH, 'ABDElevators-Auth', 'api_keys');
    await moveCollection(clients.MAIN, 'ABDElevators', clients.CONFIG, 'ABDElevators-Config', 'workflow_definitions');
    await moveCollection(clients.MAIN, 'ABDElevators', clients.CONFIG, 'ABDElevators-Config', 'ai_workflows');
    await moveCollection(clients.MAIN, 'ABDElevators', clients.LOGS, 'ABDElevators-Logs', 'workflow_analytics');
    await moveCollection(clients.MAIN, 'ABDElevators', clients.LOGS, 'ABDElevators-Logs', 'rag_evaluations');

    // --- 2. DEPRECATIONS (IN MAIN) ---
    await renameInDb(mainDb, 'asset_chunks', `asset_chunks_migrated_${timestamp}`);
    await renameInDb(mainDb, 'rate_limits', `rate_limits_migrated_${timestamp}`);

    console.log('🏁 Final Migration Complete!');
    for (const client of Object.values(clients)) await client.close();
}

migrateEra12Final().catch(console.error);
