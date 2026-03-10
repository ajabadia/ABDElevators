import path from 'node:path';
import { connectConfigDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function discoverConfigCluster() {
    try {
        const configDb = await connectConfigDB();
        const client = configDb.client;
        const dbs = await client.db().admin().listDatabases();
        console.log('Available databases in CONFIG cluster:', dbs.databases.map((db: any) => db.name));

        for (const dbInfo of dbs.databases) {
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            console.log(`\n- DB: ${dbInfo.name}`);
            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`  * ${col.name}: ${count} docs`);
            }
        }

        await client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

discoverConfigCluster();
