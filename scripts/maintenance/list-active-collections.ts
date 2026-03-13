
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listNonEmptyCollections() {
    const uris = {
        MAIN: process.env.MONGODB_URI,
        AUTH: process.env.MONGODB_AUTH_URI,
        CONFIG: process.env.MONGODB_CONFIG_URI,
        LOGS: process.env.MONGODB_LOGS_URI
    };

    for (const [name, uri] of Object.entries(uris)) {
        if (!uri) continue;
        const client = new MongoClient(uri);
        try {
            await client.connect();
            const dbList = await client.db().admin().listDatabases();
            
            for (const dbInfo of dbList.databases) {
                if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
                const db = client.db(dbInfo.name);
                const collections = await db.listCollections().toArray();
                for (const col of collections) {
                    const count = await db.collection(col.name).countDocuments();
                    if (count > 0) {
                        console.log(`${name} | ${dbInfo.name} | ${col.name} | ${count} docs`);
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

listNonEmptyCollections();
