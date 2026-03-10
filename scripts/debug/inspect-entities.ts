import path from 'node:path';
import { connectDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectEntities() {
    try {
        const db = await connectDB();
        const col = db.collection('entities');
        const count = await col.countDocuments();
        console.log(`--- Collection: entities ---`);
        console.log(`Count: ${count}`);

        if (count > 0) {
            const sample = await col.findOne({});
            console.log('Sample:', JSON.stringify(sample, null, 2));
        }

        await db.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

inspectEntities();
