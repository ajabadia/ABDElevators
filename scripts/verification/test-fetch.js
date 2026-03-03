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
        const dbMain = client.db('ABDElevators');
        const knowledgeAssets = dbMain.collection('knowledge_assets');
        const asset = await knowledgeAssets.findOne({ filename: /Real Decreto/i }, { sort: { updatedAt: -1 } });

        if (asset) {
            console.log('--- ASSET DATA ---');
            console.log('URL:', asset.cloudinaryUrl);

            console.log('--- FETCH TEST ---');
            try {
                // Use global fetch (Node 18+)
                const start = Date.now();
                const response = await fetch(asset.cloudinaryUrl);
                console.log('Status:', response.status);
                console.log('StatusText:', response.statusText);
                console.log('Duration:', Date.now() - start, 'ms');
            } catch (fetchErr) {
                console.log('Fetch Error:', fetchErr.message);
                console.log('Fetch Error Stack:', fetchErr.stack);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

main();
