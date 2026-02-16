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
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(); // Default db from URI

        console.log('--- DATABASE INFO ---');
        console.log('Using DB:', db.databaseName);

        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const knowledgeAssets = db.collection('knowledge_assets');
        const assets = await knowledgeAssets.find({ filename: /Real Decreto/i }).toArray();

        console.log('Found assets count:', assets.length);
        assets.forEach(asset => {
            console.log(`- ID: ${asset._id}, Filename: ${asset.filename}, Status: ${asset.ingestionStatus}, Error: ${asset.error}`);
            console.log(`  URL: ${asset.cloudinaryUrl}`);
        });

        const auditCollection = db.collection('audit_ingestion');
        const lastAudit = await auditCollection.find({ status: 'FAILED' }).sort({ createdAt: -1 }).limit(1).toArray();
        if (lastAudit.length > 0) {
            console.log('--- LAST FAILED AUDIT ---');
            console.log(JSON.stringify(lastAudit[0], null, 2));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

main();
