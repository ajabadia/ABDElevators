import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listAll() {
    let output = '🔍 Deep Scan Prompt...\n';
    const uri = process.env.MONGODB_URI;
    if (!uri) return;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const prompts = await db.collection('prompts').find({ key: 'CAUSAL_IMPACT_ANALYSIS' }).toArray();

        output += `Total prompts found: ${prompts.length}\n`;
        prompts.forEach((p, i) => {
            output += `\n--- Prompt ${i + 1} ---\n`;
            output += JSON.stringify(p, null, 2) + '\n';
        });

    } catch (err: any) {
        output += `❌ Error: ${err.message}\n`;
    } finally {
        await client.close();
        fs.writeFileSync('db_scan_deep.txt', output);
        console.log('Fichero db_scan_deep.txt generado.');
    }
}

listAll();
