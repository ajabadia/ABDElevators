
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function huntEverywhere() {
    const uris = [
        { name: 'MAIN', uri: process.env.MONGODB_URI },
        { name: 'AUTH', uri: process.env.MONGODB_AUTH_URI },
        { name: 'LOGS', uri: process.env.MONGODB_LOGS_URI }
    ];

    console.log('🌍 Multi-Cluster Hunt starting...');

    for (const { name, uri } of uris) {
        if (!uri) continue;
        console.log(`\n--- Inspecting ${name} Cluster ---`);
        const client = new MongoClient(uri);
        try {
            await client.connect();
            const admin = client.db().admin();
            const dbs = await admin.listDatabases();

            for (const dbInfo of dbs.databases) {
                const db = client.db(dbInfo.name);
                const collections = await db.listCollections().toArray();
                for (const col of collections) {
                    const collection = db.collection(col.name);
                    const count = await collection.countDocuments({
                        $or: [
                            { name: /Flow/i },
                            { name: /Flujo/i },
                            { tenantId: "default_tenant" }
                        ]
                    });

                    if (count > 0) {
                        const sample = await collection.findOne({
                            $or: [
                                { name: /Flow/i },
                                { name: /Flujo/i },
                                { tenantId: "default_tenant" }
                            ]
                        });
                        console.log(`✅ [${name}][${dbInfo.name}.${col.name}] Count: ${count}`);
                        console.log(`Sample: ${JSON.stringify(sample, null, 2)}`);
                    }
                }
            }
        } catch (e) {
            console.error(`Error in ${name}:`, e);
        } finally {
            await client.close();
        }
    }
}

huntEverywhere();
