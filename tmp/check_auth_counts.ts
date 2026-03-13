
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkAuthCounts() {
    const uri = process.env.MONGODB_AUTH_URI;
    if (!uri) throw new Error('MONGODB_AUTH_URI not found');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('ABDElevators-Auth');

    const collections = [
        'organizations',
        'sessions',
        'tenants',
        'users',
        'v2_users',
        'magic_links'
    ];
    
    for (const name of collections) {
        try {
            const count = await db.collection(name).countDocuments();
            console.log(`${name}: ${count}`);
        } catch (e) {
            console.log(`${name}: NOT FOUND`);
        }
    }

    await client.close();
}

checkAuthCounts().catch(console.error);
