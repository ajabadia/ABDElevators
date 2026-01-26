import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkPrompts() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db();
        const tenantId = process.env.SINGLE_TENANT_ID;
        console.log('DEBUG: SINGLE_TENANT_ID is', tenantId);
        const prompts = await db.collection('prompts').find({}).toArray();
        console.log(`--- All Prompts ---`);
        prompts.forEach(p => {
            console.log(`Key: ${p.key}, Tenant: ${p.tenantId}, Model: ${p.model || 'N/A'}`);
        });
    } finally {
        await client.close();
    }
}

checkPrompts();
