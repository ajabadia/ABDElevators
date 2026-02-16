import { connectDB } from '../src/lib/db';
import dotenv from 'dotenv';
import path from 'path';
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugFailedAsset() {
    const logPath = 'debug_asset_output.log';
    let logBuffer = '';
    const log = (msg: string) => {
        logBuffer += msg + '\n';
        console.log(msg);
    };

    try {
        const db = await connectDB();
        const assets = db.collection('knowledge_assets');
        const logs = db.collection('logs');

        const asset = await assets.findOne({ filename: /Real Decreto/ });

        if (!asset) {
            log('Asset not found');
            return;
        }

        log('--- ASSET DETAILS ---');
        log(JSON.stringify(asset, null, 2));

        log('\n--- RECENT LOGS FOR THIS ASSET ---');
        const relevantLogs = await logs.find({
            $or: [
                { 'details.assetId': asset._id.toString() },
                { 'details.filename': asset.filename },
                { message: new RegExp(asset.filename, 'i') }
            ]
        }).sort({ timestamp: -1 }).limit(50).toArray();

        if (relevantLogs.length > 0) {
            relevantLogs.forEach(l => {
                log(`[${l.timestamp?.toISOString()}] [${l.level}] ${l.action}: ${l.message}`);
                if (l.details) log('Details: ' + JSON.stringify(l.details, null, 2));
                log('---');
            });
        } else {
            log('No relevant logs found in "logs" collection.');
        }

        fs.writeFileSync(logPath, logBuffer);
        console.log(`Log written to ${logPath}`);

    } catch (e: any) {
        console.error('Error debugging:', e);
        fs.writeFileSync(logPath, e.stack || e.message);
    } finally {
        process.exit(0);
    }
}

debugFailedAsset();
