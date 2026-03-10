import path from 'node:path';
import { connectLogsDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function inspectHumanValidations() {
    try {
        const logsDb = await connectLogsDB();
        const col = logsDb.collection('human_validations');
        const count = await col.countDocuments();
        console.log(`--- Collection: human_validations ---`);
        console.log(`Count: ${count}`);

        if (count > 0) {
            const sample = await col.findOne({});
            console.log('Sample:', JSON.stringify(sample, null, 2));
        }

        await logsDb.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

inspectHumanValidations();
