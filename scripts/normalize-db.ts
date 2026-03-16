
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function normalizeDB() {
    const uri = process.env.MONGODB_URI;
    const logsUri = process.env.MONGODB_LOGS_URI;

    if (!uri || !logsUri) {
        console.error('Missing MONGODB_URI or MONGODB_LOGS_URI');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    const logsClient = new MongoClient(logsUri);

    try {
        await client.connect();
        await logsClient.connect();

        const db = client.db(); // MAIN/AUTH
        const logsDb = logsClient.db(); // LOGS

        console.log('--- Starting Normalization ---');

        // 1. Normalize Tenants
        console.log('Normalizing tenants collection...');
        const tenants = db.collection('tenants');
        const tenantDocs = await tenants.find({}).toArray();

        for (const doc of tenantDocs) {
            const updates: any = {};
            
            // quota_bytes -> quotaBytes
            if (doc.storage?.quota_bytes !== undefined) {
                updates['storage.quotaBytes'] = doc.storage.quota_bytes;
                // No unsetting yet to be safe, but we probably should
            }
            
            // folder_prefix -> folderPrefix
            if (doc.storage?.settings?.folder_prefix !== undefined) {
                updates['storage.settings.folderPrefix'] = doc.storage.settings.folder_prefix;
            }

            if (Object.keys(updates).length > 0) {
                await tenants.updateOne({ _id: doc._id }, { $set: updates });
                console.log(`Updated tenant ${doc.tenantId || doc._id}`);
            }
        }

        // 2. Normalize Usage Logs
        console.log('Normalizing usage_logs collection...');
        const usageLogs = logsDb.collection('usage_logs');
        
        // Use bulkWrite for efficiency
        const legacyLogs = await usageLogs.find({
            $or: [
                { tipo: { $exists: true } },
                { valor: { $exists: true } },
                { correlacion_id: { $exists: true } }
            ]
        }).toArray();

        console.log(`Found ${legacyLogs.length} legacy logs to normalize.`);

        const bulkOps = legacyLogs.map(doc => {
            const set: any = {};
            const unset: any = {};

            if (doc.tipo) { set.type = doc.tipo; unset.tipo = ""; }
            if (doc.valor !== undefined) { set.value = doc.valor; unset.valor = ""; }
            if (doc.correlacion_id) { set.correlationId = doc.correlacion_id; unset.correlacion_id = ""; }

            return {
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: set, $unset: unset }
                }
            };
        });

        if (bulkOps.length > 0) {
            await usageLogs.bulkWrite(bulkOps);
            console.log('Bulk normalization of usage_logs completed.');
        }

        // 3. Purge corrupted records (e.g., missing tenantId)
        console.log('Purging corrupted records...');
        const purgedTenants = await tenants.deleteMany({ tenantId: { $exists: false } });
        const purgedLogs = await usageLogs.deleteMany({ tenantId: { $exists: false } });
        
        console.log(`Purged ${purgedTenants.deletedCount} corrupted tenants.`);
        console.log(`Purged ${purgedLogs.deletedCount} corrupted usage logs.`);

        console.log('--- Normalization Finished ---');

    } catch (error) {
        console.error('Normalization failed:', error);
    } finally {
        await client.close();
        await logsClient.close();
    }
}

normalizeDB();
