import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function quickCheck() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const tenants = await db.collection('prompts').distinct('tenantId');
        fs.writeFileSync('results.txt', `TENANTS IN PROMPTS: ${JSON.stringify(tenants)}`);
    } finally {
        await client.close();
    }
}
quickCheck();
