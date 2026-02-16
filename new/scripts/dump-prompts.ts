import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function dumpPrompts() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const prompts = await db.collection('prompts').find({}).toArray();
        let out = `COUNT: ${prompts.length}\n`;
        prompts.forEach(p => {
            out += `[${p.key}] tenant:[${p.tenantId}] model:[${p.model}] version:[${p.version}]\n`;
        });
        fs.writeFileSync('prompts_dump.txt', out);
    } finally {
        await client.close();
    }
}
dumpPrompts();
