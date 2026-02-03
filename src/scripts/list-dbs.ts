import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listDbs() {
    const uri = process.env.MONGODB_URI;
    if (!uri) return;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();
        console.log('--- DATABASES ---');
        dbs.databases.forEach(db => {
            console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`);
        });
        console.log('-----------------');
    } catch (e: any) {
        console.error('ERROR:', e.message);
    } finally {
        await client.close();
    }
}
listDbs();
