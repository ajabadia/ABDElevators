import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function deepCheck() {
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const prompts = await db.collection('prompts').find({}).toArray();
        let out = '';
        out += `TOTAL PROMPTS FOUND: ${prompts.length}\n`;
        prompts.forEach(p => {
            out += `KEY: [${p.key}] (len: ${p.key.length}) | TENANT: [${p.tenantId}] | ACTIVE: ${p.active}\n`;
        });

        // Simular búsqueda exacta
        const targetKey = "LANGUAGE_DETECTOR";
        const targetTenant = "default_tenant";
        const found = await db.collection('prompts').findOne({
            key: targetKey,
            tenantId: targetTenant,
            active: true
        });

        out += `\nSEARCH SIMULATION:\n`;
        out += `Looking for: key=[${targetKey}], tenant=[${targetTenant}], active=true\n`;
        out += `Found: ${found ? 'YES' : 'NO'}\n`;
        if (found) {
            out += `Data: ${JSON.stringify({ key: found.key, tenantId: found.tenantId, active: found.active })}\n`;
        } else {
            // Check alternatives
            const byKey = await db.collection('prompts').find({ key: targetKey }).toArray();
            out += `Prompts with same Key but diff Tenant/Active: ${byKey.length}\n`;
            byKey.forEach(p => out += `  -> Tenant: [${p.tenantId}], Active: ${p.active}\n`);
        }

        fs.writeFileSync('deep_check.txt', out);
    } finally {
        await client.close();
    }
}
deepCheck();
