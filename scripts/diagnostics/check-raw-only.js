const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkRaw() {
    console.log('--- RAW DB CHECK (ZERO DEPS) ---');
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI not found in env');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected successfully');
        const db = client.db('ABDElevators');
        const collections = await db.listCollections().toArray();
        console.log(`✅ Found ${collections.length} collections`);
        await client.close();
        console.log('--- SUCCESS ---');
    } catch (e) {
        console.error('❌ Connection failed:', e.message);
        process.exit(1);
    }
}

checkRaw();
