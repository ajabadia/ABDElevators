const { MongoClient, ObjectId } = require('mongodb');
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
    if (!uri) {
        console.error('MONGODB_URI not found in .env.local');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('test'); // Or the actual DB name if known, but let's try to infer or use default
        // If the project doesn't specify DB name in URI, it might be in an env var.
        // Let's list dbs if needed, but usually it's in the URI.

        const collections = await db.listCollections().toArray();
        const knowledgeAssets = db.collection('knowledge_assets');
        const asset = await knowledgeAssets.findOne({ ingestionStatus: 'FAILED' }, { sort: { updatedAt: -1 } });

        if (asset) {
            console.log('--- ASSET DATA ---');
            console.log('ID:', asset._id);
            console.log('Filename:', asset.filename);
            console.log('Status:', asset.ingestionStatus);
            console.log('Error:', asset.error);
            console.log('URL:', asset.cloudinaryUrl);
        } else {
            console.log('No failed assets found.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

main();
