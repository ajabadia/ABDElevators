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

async function cleanup() {
    if (!mainUri) return;
    const client = new MongoClient(mainUri);
    await client.connect();
    const db = client.db('ABDElevators');

    // Remove document types with undefined or empty names
    const result = await db.collection('document_types').deleteMany({
        $or: [
            { name: { $exists: false } },
            { name: null },
            { name: "undefined" },
            { name: "" }
        ]
    });

    console.log(`Cleaned up ${result.deletedCount} invalid document types.`);
    await client.close();
}
cleanup();
