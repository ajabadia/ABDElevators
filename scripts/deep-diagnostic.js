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
        const asset = await db.collection('knowledge_assets').find({ filename: /Real Decreto/i }).sort({ updatedAt: -1 }).limit(1).next();

        if (asset) {
            console.log('--- ERROR DIAGNOSTIC ---');
            console.log('Ingestion Status:', asset.ingestionStatus);
            console.log('Progress:', asset.progress);
            console.log('Main Error:', asset.error);
            if (asset.errorDetails) {
                console.log('Nested Details:', JSON.stringify(asset.errorDetails, null, 2));
            }
        } else {
            console.log('No asset found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
main();
