import path from 'node:path';
import { getMongoClient, connectConfigDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function quickCompare() {
    try {
        console.log('--- QUICK COMPARING TRANSLATIONS ---');
        const client = await getMongoClient();
        const configDb = await connectConfigDB();

        const sourceCol = client.db('abd-rag-ascensores').collection('translations');
        const targetCol = configDb.collection('translations');

        const sourceCount = await sourceCol.countDocuments();
        const targetCount = await targetCol.countDocuments();

        console.log(`Source: ${sourceCount} | Target: ${targetCount}`);

        const samples = await sourceCol.find({}).limit(5).toArray();
        for (const s of samples) {
            const exists = await targetCol.findOne({ key: s.key, locale: s.locale });
            console.log(`[${s.locale}] ${s.key} -> ${exists ? 'MATCH' : 'MISSING'}`);
        }

        await client.close();
        await configDb.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

quickCompare();
