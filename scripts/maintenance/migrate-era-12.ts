
import { MongoClient, Document } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateEra12() {
    console.log('🚀 Starting Era 12 Database Migration...');

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
    if (!mainDb) throw new Error('MAIN DB not found');

    const configDb = clients.CONFIG.db('ABDElevators-Config');
    const logsDb = clients.LOGS.db('ABDElevators-Logs');

    /**
     * Helper to move collection between DBs/Clusters
     */
    async function moveCollection(sourceClient: MongoClient, sourceDbName: string, targetClient: MongoClient, targetDbName: string, collectionName: string, targetName?: string) {
        const sourceDb = sourceClient.db(sourceDbName);
        const targetDb = targetClient.db(targetDbName);
        const finalName = targetName || collectionName;

        console.log(`📦 Moving [${collectionName}] from ${sourceDbName} to ${targetDbName} as [${finalName}]...`);
        
        const count = await sourceDb.collection(collectionName).countDocuments();
        if (count === 0) {
            console.log(`  ⚠️ Collection [${collectionName}] is empty or not found in ${sourceDbName}. Skipping move.`);
            return;
        }

        const documents = await sourceDb.collection(collectionName).find({}).toArray();
        await targetDb.collection(finalName).insertMany(documents as any);
        await sourceDb.collection(collectionName).drop();
        console.log(`  ✅ Moved ${count} documents.`);
    }

    /**
     * Helper to rename collection within same DB
     */
    async function renameInDb(db: any, oldName: string, newName: string) {
        console.log(`✏️ Renaming [${oldName}] to [${newName}] in ${db.databaseName}...`);
        try {
            const collections = await db.listCollections({ name: oldName }).toArray();
            if (collections.length === 0) {
                console.log(`  ⚠️ Collection [${oldName}] not found. Skipping.`);
                return;
            }
            await db.collection(oldName).rename(newName);
            console.log(`  ✅ Renamded.`);
        } catch (e) {
            console.warn(`  ❌ Rename failed:`, e.message);
        }
    }

    /**
     * Helper to drop collection
     */
    async function safeDrop(db: any, colName: string) {
        console.log(`🗑️ Purging [${colName}] from ${db.databaseName}...`);
        try {
            const collections = await db.listCollections({ name: colName }).toArray();
            if (collections.length === 0) {
                 console.log(`  ⚠️ Collection [${colName}] not found. Skipping.`);
                 return;
            }
            await db.collection(colName).drop();
            console.log(`  ✅ Purged.`);
        } catch (e) {
            console.warn(`  ❌ Purge failed:`, e.message);
        }
    }

    // --- 1. PURGE LEGACY (MAIN) ---
    const legacyMain = [
        'ai_corrections_migrated_20260309',
        'audit_ingestion_migrated_20260309',
        'document_types_migrated_20260309',
        'organizations_migrated_20260309',
        'prompts_migrated_20260309',
        'translations_migrated_20260309',
        'file_blobs_unused_20260309',
        'processed_events_unused_20260309',
        'tenants_unused_20260309',
        'test_isolation_unused_20260309'
    ];
    for (const col of legacyMain) await safeDrop(mainDb, col);

    // --- 2. RENAMES (MAIN) ---
    await renameInDb(mainDb, 'pedidos', 'orders');
    await renameInDb(mainDb, 'entities', 'technical_entities');
    await renameInDb(mainDb, 'configs_checklist', 'checklist_configs');

    // --- 3. RELOCATIONS (TO MAIN) ---
    // knowledge_assets, user_documents, document_chunks were in LOGS or had duplicates
    await moveCollection(clients.LOGS, 'ABDElevators-Logs', clients.MAIN, 'ABDElevators', 'knowledge_assets');
    await moveCollection(clients.LOGS, 'ABDElevators-Logs', clients.MAIN, 'ABDElevators', 'user_documents');
    await moveCollection(clients.LOGS, 'ABDElevators-Logs', clients.MAIN, 'ABDElevators', 'document_chunks');
    // asset_chunks merge into document_chunks (if exists separately)
    await moveCollection(clients.MAIN, 'ABDElevators', clients.MAIN, 'ABDElevators', 'asset_chunks', 'document_chunks');

    // --- 4. RELOCATIONS (TO CONFIG) ---
    await moveCollection(clients.MAIN, 'ABDElevators', clients.CONFIG, 'ABDElevators-Config', 'prompts');
    await moveCollection(clients.MAIN, 'ABDElevators', clients.CONFIG, 'ABDElevators-Config', 'document_types');
    await moveCollection(clients.MAIN, 'ABDElevators', clients.CONFIG, 'ABDElevators-Config', 'policies');
    await moveCollection(clients.MAIN, 'ABDElevators', clients.CONFIG, 'ABDElevators-Config', 'organizations');
    await moveCollection(clients.MAIN, 'ABDElevators', clients.CONFIG, 'ABDElevators-Config', 'kb_models_registry');

    // --- 5. PURGE LEGACY (LOGS) ---
    await safeDrop(logsDb, 'ai_configs_unused_20260309');

    console.log('🏁 Migration Complete!');
    for (const client of Object.values(clients)) await client.close();
}

migrateEra12().catch(console.error);
