
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkLogs() {
    const uri = process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error('No MONGODB_LOGS_URI found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        const logs = db.collection('audit_trails');
        
        console.log('Fetching latest audit logs...');
        const latestLogs = await logs.find({})
            .sort({ timestamp: -1 })
            .limit(20)
            .toArray();
            
        console.log('Latest Logs:');
        latestLogs.forEach(log => {
            console.log(`[${log.timestamp?.toISOString()}] [${log.level}] [${log.source}] [${log.action}] ${log.message}`);
            if (log.details) console.log('Details:', JSON.stringify(log.details, null, 2));
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkLogs();
