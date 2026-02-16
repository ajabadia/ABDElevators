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
            console.log('--- DETAILED ERROR INFO ---');
            console.log('ID:', asset._id);
            console.log('Status:', asset.ingestionStatus);
            console.log('Progress:', asset.progress);
            console.log('Error Message:', asset.error);
            console.log('Error Details:', JSON.stringify(asset.errorDetails, null, 2));
            console.log('URL:', asset.cloudinaryUrl);
        } else {
            console.log('No matching asset found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

main();
