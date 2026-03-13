
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkLogs() {
    const uri = process.env.MONGODB_LOGS_URI;
    if (!uri) {
        console.error('No MONGODB_LOGS_URI found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        // The logs cluster has a specific DB name or uses default from URI.
        // Let's check common names.
        const dbNames = ['logs', 'test', 'admin'];
        
        for (const dbName of dbNames) {
            const db = client.db(dbName);
            const collections = await db.listCollections().toArray();
            if (collections.some(c => c.name === 'audit_trails')) {
                console.log(`Found "audit_trails" in "${dbName}" DB. Fetching...`);
                const logs = await db.collection('audit_trails').find({})
                    .sort({ timestamp: -1 })
                    .limit(20)
                    .toArray();
                console.log(JSON.stringify(logs, null, 2));
                return;
            }
        }
        
        console.log('Could not find "audit_trails" in common DB names.');
        // List all DBs to be sure
        const adminDb = client.db().admin();
        const dbs = await adminDb.listDatabases();
        console.log('Available Databases:', dbs.databases.map(d => d.name));

    } catch (error) {
        console.error('Error fetching logs:', error);
    } finally {
        await client.close();
    }
}

checkLogs();
