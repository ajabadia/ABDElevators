const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function main() {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const getEnv = (key) => {
        const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
        return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
    };

    const uri = getEnv('MONGODB_URI');
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const asset = await db.collection('knowledge_assets').findOne({ filename: /Real Decreto/i }, { sort: { updatedAt: -1 } });

        if (!asset) {
            console.log('No asset found');
            return;
        }

        const url = asset.cloudinaryUrl;
        console.log('FULL URL:', url);

        console.log('--- STARTING FETCH ---');
        const response = await fetch(url);
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:');
        response.headers.forEach((v, k) => console.log(`  ${k}: ${v}`));

        if (!response.ok) {
            const body = await response.text();
            console.log('Response Body:', body);
        } else {
            console.log('Fetch successful!');
        }

    } catch (err) {
        console.error('Fetch crashed:', err);
    } finally {
        await client.close();
    }
}
main();
