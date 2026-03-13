
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkConfigCounts() {
    const uri = process.env.MONGODB_CONFIG_URI;
    if (!uri) throw new Error('MONGODB_CONFIG_URI not found');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('ABDElevators-Config');

    const collections = [
        'agent_checkpoints', 
        'taxonomies', 
        'policies', 
        'translations', 
        'ai_workflows',
        'organizations'
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

checkConfigCounts().catch(console.error);
