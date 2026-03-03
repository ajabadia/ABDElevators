import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

const mainUri = getEnv('MONGODB_URI');

async function inspect() {
    if (!mainUri) return;
    const client = new MongoClient(mainUri);
    await client.connect();
    const db = client.db('ABDElevators');
    const types = await db.collection('document_types').find({}).toArray();
    console.log(JSON.stringify(types, null, 2));
    await client.close();
}
inspect();
