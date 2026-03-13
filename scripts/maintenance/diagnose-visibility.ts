
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnoseVisibility() {
    const uris = {
        MAIN: process.env.MONGODB_URI,
        AUTH: process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI,
        CONFIG: process.env.MONGODB_CONFIG_URI || process.env.MONGODB_URI
    };

    console.log('SINGLE_TENANT_ID:', process.env.SINGLE_TENANT_ID);

    for (const [name, uri] of Object.entries(uris)) {
        if (!uri) continue;
        const client = new MongoClient(uri);
        try {
            await client.connect();
            console.log(`\n--- Cluster ${name} ---`);
            const dbList = await client.db().admin().listDatabases();
            
            for (const dbInfo of dbList.databases) {
                if (dbInfo.name.startsWith('admin') || dbInfo.name.startsWith('local') || dbInfo.name.startsWith('config')) continue;
                
                const db = client.db(dbInfo.name);
                const collections = await db.listCollections().toArray();
                
                for (const col of collections) {
                    if (['knowledge_assets', 'user_documents', 'ai_configs'].includes(col.name)) {
                        const count = await db.collection(col.name).countDocuments();
                        console.log(`[${dbInfo.name}.${col.name}] Count: ${count}`);
                        if (count > 0) {
                            const samples = await db.collection(col.name).find({}).limit(5).toArray();
                            samples.forEach(s => {
                                console.log(`  - ID: ${s._id}, tenantId: ${s.tenantId}, userId: ${s.userId}, status: ${s.status}`);
                            });
                        }
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

diagnoseVisibility();
