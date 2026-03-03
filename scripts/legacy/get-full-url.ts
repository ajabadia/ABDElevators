import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

async function main() {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const getEnv = (key: string) => {
        const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
        return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
    };

    const uri = getEnv('MONGODB_URI');
    if (!uri) throw new Error('No URI');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('ABDElevators');
    const asset = await db.collection('knowledge_assets').findOne({ filename: /Real Decreto/i }, { sort: { updatedAt: -1 } });
    if (asset) {
        console.log('--- START URL ---');
        console.log(asset.cloudinaryUrl);
        console.log('--- END URL ---');
    }
    await client.close();
}
main();
