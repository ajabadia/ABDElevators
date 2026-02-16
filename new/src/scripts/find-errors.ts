import * as dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../lib/db';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function findErrors() {
    try {
        const db = await connectDB();
        const logs = db.collection('logs');
        const errors = await logs.find({ level: 'ERROR' }).sort({ timestamp: -1 }).limit(10).toArray();

        console.log('--- LATEST ERROR LOGS ---');
        errors.forEach(e => {
            console.log(`[${e.timestamp}] ${e.source} - ${e.action}: ${e.message}`);
            if (e.correlationId) console.log(`  CorrelationId: ${e.correlationId}`);
            if (e.details) console.log(`  Details: ${JSON.stringify(e.details, null, 2)}`);
            if (e.stack) console.log(`  Stack:\n${e.stack}`);
            console.log('---');
        });

        const assets = db.collection('knowledge_assets');
        const failedAssets = await assets.find({ ingestionStatus: 'FAILED' }).sort({ updatedAt: -1 }).limit(5).toArray();
        console.log('\n--- FAILED KNOWLEDGE ASSETS ---');
        failedAssets.forEach(a => {
            console.log(`[${a.updatedAt}] ${a.filename}: ${a.error}`);
            console.log(`  CorrelationId: ${a.correlationId}`);
            console.log('---');
        });

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

findErrors();
