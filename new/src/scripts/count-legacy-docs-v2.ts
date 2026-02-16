
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) return;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        const legacyCollections = [
            'documentos',
            'documentos_usuarios',
            'tipos_documento',
            'taxonomias',
            'documentos_tecnicos'
        ];

        const results: Record<string, any> = {};
        for (const colName of legacyCollections) {
            try {
                const count = await db.collection(colName).countDocuments();
                const sample = count > 0 ? await db.collection(colName).findOne() : null;
                results[colName] = {
                    count,
                    sampleKeys: sample ? Object.keys(sample) : []
                };
            } catch (e) {
                results[colName] = { error: 'Not found' };
            }
        }

        fs.writeFileSync('legacy_counts.json', JSON.stringify(results, null, 2));
        console.log('Results saved to legacy_counts.json');
    } finally {
        await client.close();
    }
}

run();
