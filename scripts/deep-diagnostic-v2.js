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

        if (asset && asset.errorDetails) {
            console.log('--- ERROR NESTED DETAILS ---');
            // If asset.errorDetails.details is a string, it might be a JSON string or just text
            // But AppError constructor passes it as 2nd arg which becomes 'details'
            console.log(JSON.stringify(asset.errorDetails, null, 2));
        } else {
            console.log('No asset or details found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}
main();
