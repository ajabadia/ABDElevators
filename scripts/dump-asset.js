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

        if (asset) {
            fs.writeFileSync('scripts/last_asset_dump.json', JSON.stringify(asset, null, 2));
            console.log('Asset dump written to scripts/last_asset_dump.json');
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
