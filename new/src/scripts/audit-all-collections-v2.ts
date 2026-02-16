
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function getCollectionsFor(uri: string | undefined) {
    if (!uri) return [];

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const dbsResult = await client.db().admin().listDatabases();
        const result = [];
        for (const dbInfo of dbsResult.databases) {
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            result.push({
                database: dbInfo.name,
                collections: collections.map(c => c.name)
            });
        }
        return result;
    } catch (e: any) {
        return { error: e.message };
    } finally {
        await client.close();
    }
}

async function run() {
    const report = {
        main: await getCollectionsFor(process.env.MONGODB_URI),
        auth: await getCollectionsFor(process.env.MONGODB_AUTH_URI),
        logs: await getCollectionsFor(process.env.MONGODB_LOGS_URI),
        timestamp: new Date().toISOString()
    };

    fs.writeFileSync('db_audit_report.json', JSON.stringify(report, null, 2));
    console.log('Audit report saved to db_audit_report.json');
}

run();
