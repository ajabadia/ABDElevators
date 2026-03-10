import path from 'node:path';
import { connectDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectConfigs() {
    try {
        const db = await connectDB();
        const collections = ['tenant_configs', 'workflow_configs'];

        for (const colName of collections) {
            console.log(`\n--- Collection: ${colName} ---`);
            const col = db.collection(colName);
            const count = await col.countDocuments();
            console.log(`Count: ${count}`);
            if (count > 0) {
                const sample = await col.findOne({});
                console.log('Sample:', JSON.stringify(sample, null, 2));
            }
        }

        await db.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

inspectConfigs();
