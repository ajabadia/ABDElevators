import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI; // Logs are usually in the same cluster or MAIN
const authUri = process.env.MONGODB_AUTH_URI;

async function checkLogs() {
    if (!uri) {
        console.error('❌ MONGODB_URI not found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');
        const logs = db.collection('audit_trails');
        
        console.log('--- Ultimos 5 logs de API_USER_PREFERENCES ---');
        const recentLogs = await logs.find({ 
            source: 'API_USER_PREFERENCES' 
        }).sort({ createdAt: -1 }).limit(5).toArray();

        console.log(JSON.stringify(recentLogs, null, 2));

        console.log('\n--- Ultimos 5 logs de AUTH_GUARD ---');
         const authLogs = await logs.find({ 
            source: 'AUTH_GUARD' 
        }).sort({ createdAt: -1 }).limit(5).toArray();

        console.log(JSON.stringify(authLogs, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkLogs();
