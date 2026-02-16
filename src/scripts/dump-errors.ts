import * as dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../lib/db';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function dumpErrors() {
    try {
        const db = await connectDB();
        const logs = db.collection('logs');
        const errors = await logs.find({ level: 'ERROR' }).sort({ timestamp: -1 }).limit(10).toArray();

        const assets = db.collection('knowledge_assets');
        const failedAssets = await assets.find({ ingestionStatus: 'FAILED' }).sort({ updatedAt: -1 }).limit(5).toArray();

        const data = {
            errors,
            failedAssets
        };

        fs.writeFileSync('error_dump.json', JSON.stringify(data, null, 2));
        console.log('✅ Errors dumped to error_dump.json');

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

dumpErrors();
