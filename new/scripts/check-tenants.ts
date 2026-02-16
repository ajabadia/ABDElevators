import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkTenants() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const tenants = await db.collection('tenants').find({}).toArray();
        fs.writeFileSync('tenants_check.txt', JSON.stringify(tenants, null, 2));
    } finally {
        await client.close();
    }
}
checkTenants();
