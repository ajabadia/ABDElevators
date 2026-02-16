
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function diagnose() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');

        console.log('=== TARGETED INGESTION DIAGNOSTICS ===\n');

        const assets = await db.collection('knowledge_assets').find({}).sort({ createdAt: -1 }).limit(10).toArray();
        if (assets.length === 0) {
            console.log('No assets found.');
        } else {
            console.table(assets.map(a => ({
                id: a._id.toString(),
                filename: a.filename,
                status: a.ingestionStatus,
                url: a.cloudinaryUrl ? 'SET' : 'MISSING',
                error: a.error ? (a.error.substring(0, 50) + '...') : 'N/A',
                correlationId: a.correlationId
            })));
        }

        console.log('\nRECENT LOGS (INGESTION-RELATED):');
        const logs = await db.collection('logs').find({
            source: { $in: ['INGEST_PREPARER', 'INGEST_SERVICE', 'SIMPLE_WORKER', 'STATE_VALIDATOR'] }
        }).sort({ timestamp: -1 }).limit(15).toArray();

        if (logs.length === 0) {
            console.log('No relevant logs found.');
        } else {
            for (const log of logs) {
                const date = log.timestamp instanceof Date ? log.timestamp.toISOString() : new Date(log.timestamp).toISOString();
                console.log(`[${date}] ${log.source} - ${log.action}: ${log.message}`);
                if (log.details && Object.keys(log.details).length > 0) {
                    console.log('  Details:', JSON.stringify(log.details));
                }
            }
        }

    } catch (error) {
        console.error('DIAGNOSTIC ERROR:', error);
    } finally {
        await client.close();
    }
}

diagnose();
