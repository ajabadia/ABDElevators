
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fullArchitectureAudit() {
    const uris = {
        MAIN: process.env.MONGODB_URI,
        AUTH: process.env.MONGODB_AUTH_URI,
        CONFIG: process.env.MONGODB_CONFIG_URI,
        LOGS: process.env.MONGODB_LOGS_URI
    };

    const auditResults: any = {};

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
                    const sample = await db.collection(col.name).findOne({});
                    const schema = sample ? Object.keys(sample) : [];
                    
                    if (!auditResults[col.name]) auditResults[col.name] = [];
                    auditResults[col.name].push({ cluster: name, db: dbInfo.name, count, schema });
                }
            }
        } catch (e) {
            console.error(`Error in ${name}:`, e);
        } finally {
            await client.close();
        }
    }

    console.log(JSON.stringify(auditResults, null, 2));
}

fullArchitectureAudit();
