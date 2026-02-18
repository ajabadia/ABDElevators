import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listAll() {
    let output = '🔍 Scanning Databases...\n';
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        fs.writeFileSync('db_scan.txt', 'No MONGODB_URI');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();

        output += `Databases found: ${dbs.databases.map(d => d.name).join(', ')}\n\n`;

        for (const dbInfo of dbs.databases) {
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();
            output += `Explorando DB: ${dbInfo.name}\n`;
            output += `  Collections: ${collections.map(c => c.name).join(', ')}\n`;

            const promptColl = collections.find(c => c.name === 'prompts');
            if (promptColl) {
                const count = await db.collection('prompts').countDocuments();
                const sample = await db.collection('prompts').findOne();
                output += `  🚀 Colección 'prompts' ENCONTRADA en ${dbInfo.name}\n`;
                output += `  Count: ${count}\n`;
                if (sample) output += `  Ejemplo TenantId: ${sample.tenantId}, Key: ${sample.key}\n`;

                const causal = await db.collection('prompts').findOne({ key: 'CAUSAL_IMPACT_ANALYSIS' });
                if (causal) {
                    output += `  ✅ CAUSAL_IMPACT_ANALYSIS está en esta DB con tenant: ${causal.tenantId}\n`;
                }
            }
            output += '\n';
        }
    } catch (err: any) {
        output += `❌ Error: ${err.message}\n`;
    } finally {
        await client.close();
        fs.writeFileSync('db_scan.txt', output);
        console.log('Fichero db_scan.txt generado.');
    }
}

listAll();
