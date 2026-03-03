import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

const authUri = getEnv('MONGODB_AUTH_URI');

async function inspect() {
    if (!authUri) {
        console.error('No MONGODB_AUTH_URI found');
        return;
    }
    const client = new MongoClient(authUri);
    await client.connect();

    const dbName = 'ABDElevators-Auth';
    console.log('Using DB:', dbName);

    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    if (collections.some(c => c.name === 'users')) {
        const user = await db.collection('users').findOne({});
        console.log('User Sample:', JSON.stringify(user, null, 2));
    }

    await client.close();
}
inspect();
