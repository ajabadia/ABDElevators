
import { MongoClient, Document } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateEra12Safe() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    console.log(`🚀 Starting Era 12 Safe Database Migration [TS: ${timestamp}]...`);

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
    const configDb = clients.CONFIG.db('ABDElevators-Config');
    const logsDb = clients.LOGS.db('ABDElevators-Logs');

    /**
     * Helper to move collection between DBs with backup
     */
    async function moveCollectionSafe(sourceClient: MongoClient, sourceDbName: string, targetClient: MongoClient, targetDbName: string, collectionName: string, targetName?: string) {
        const sourceDb = sourceClient.db(sourceDbName);
        const targetDb = targetClient.db(targetDbName);
        const finalName = targetName || collectionName;

        console.log(`📦 Moving [${collectionName}] to ${targetDbName} as [${finalName}]...`);
        
        const collections = await sourceDb.listCollections({ name: collectionName }).toArray();
        if (collections.length === 0) return;

        const count = await sourceDb.collection(collectionName).countDocuments();
        if (count > 0) {
            const documents = await sourceDb.collection(collectionName).find({}).toArray();
            await targetDb.collection(finalName).insertMany(documents as any);
        }

        // Instead of drop, rename to migrated
        const backupName = `${collectionName}_migrated_${timestamp}`;
        await sourceDb.collection(collectionName).rename(backupName);
        console.log(`  ✅ Moved and backed up as [${backupName}] in ${sourceDbName}.`);
    }

    /**
     * Helper to rename collection within same DB (safe variant)
     */
    async function renameInDbSafe(db: any, oldName: string, newName: string) {
        console.log(`✏️ Renaming [${oldName}] to [${newName}] in ${db.databaseName}...`);
        const collections = await db.listCollections({ name: oldName }).toArray();
        if (collections.length === 0) return;

        // In MongoDB, rename is an "atomic" move. 
        // To keep the old one, we should ideally copy then rename the original to "migrated"
        const count = await db.collection(oldName).countDocuments();
        if (count > 0) {
            const docs = await db.collection(oldName).find({}).toArray();
            await db.collection(newName).insertMany(docs);
        } else {
            // Create empty collection if it didn't exist but we want the name
            await db.createCollection(newName);
        }
        
        const backupName = `${oldName}_migrated_${timestamp}`;
        await db.collection(oldName).rename(backupName);
        console.log(`  ✅ Created [${newName}] and backed up original as [${backupName}].`);
    }

    /**
     * Helper to "deprecate" by just renaming
     */
    async function safeDeprecate(db: any, colName: string) {
        const collections = await db.listCollections({ name: colName }).toArray();
        if (collections.length === 0) return;

        console.log(`🗑️ Safe Deprecating [${colName}]...`);
        const backupName = `${colName.includes('migrated') ? colName : colName + '_migrated'}_${timestamp}`;
        await db.collection(colName).rename(backupName);
        console.log(`  ✅ Renamded to [${backupName}].`);
    }

    // --- EXECUTION ---

    // 1. MAIN RENAMES & DEPRECATIONS
    const coreRenames = [
        { old: 'pedidos', new: 'orders' },
        { old: 'entities', new: 'technical_entities' },
        { old: 'configs_checklist', new: 'checklist_configs' }
    ];
    for (const r of coreRenames) await renameInDbSafe(mainDb, r.old, r.new);

    // 2. RELOCATIONS (MOVE & BACKUP)
    // From LOGS to MAIN
    await moveCollectionSafe(clients.LOGS, 'ABDElevators-Logs', clients.MAIN, 'ABDElevators', 'knowledge_assets');
    await moveCollectionSafe(clients.LOGS, 'ABDElevators-Logs', clients.MAIN, 'ABDElevators', 'user_documents');
    await moveCollectionSafe(clients.LOGS, 'ABDElevators-Logs', clients.MAIN, 'ABDElevators', 'document_chunks');
    
    // From MAIN to CONFIG
    await moveCollectionSafe(clients.MAIN, 'ABDElevators', clients.CONFIG, 'ABDElevators-Config', 'prompts');
    await moveCollectionSafe(clients.MAIN, 'ABDElevators', clients.CONFIG, 'ABDElevators-Config', 'document_types');
    await moveCollectionSafe(clients.MAIN, 'ABDElevators', clients.CONFIG, 'ABDElevators-Config', 'policies');
    
    // 3. CLEANUP (SAFE DEPRECATE)
    const toDeprecateMain = ['organizations', 'translations', 'test_isolation_unused_20260309']; // Example legacy
    for (const col of toDeprecateMain) await safeDeprecate(mainDb, col);
    
    await safeDeprecate(logsDb, 'ai_configs_unused_20260309');

    console.log('🏁 Safe Migration Complete!');
    for (const client of Object.values(clients)) await client.close();
}

migrateEra12Safe().catch(console.error);
