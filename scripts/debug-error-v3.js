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

        // --- ASSETS ---
        const dbMain = client.db('ABDElevators');
        const knowledgeAssets = dbMain.collection('knowledge_assets');
        const assets = await knowledgeAssets.find({ filename: /Real Decreto/i }).sort({ updatedAt: -1 }).toArray();

        console.log('--- MAIN DB: ABDElevators ---');
        console.log('Found assets count:', assets.length);
        if (assets.length > 0) {
            const asset = assets[0]; // Get the most recent one
            console.log(`- ID: ${asset._id}`);
            console.log(`  Filename: ${asset.filename}`);
            console.log(`  Status: ${asset.ingestionStatus}`);
            console.log(`  Error: ${asset.error}`);
            console.log(`  URL: ${asset.cloudinaryUrl}`);
        }

        // --- AUDIT ---
        const dbLogs = client.db('ABDElevators-Logs'); // Try ABDElevators-Logs
        const auditCollection = dbLogs.collection('audit_ingestion');
        const lastAudit = await auditCollection.find({}).sort({ createdAt: -1 }).limit(3).toArray();

        console.log('--- LOGS DB: ABDElevators-Logs ---');
        if (lastAudit.length > 0) {
            lastAudit.forEach(a => {
                console.log(`- Audit ID: ${a._id}, Status: ${a.status}, Filename: ${a.filename}, Message: ${a.message || 'no msg'}`);
                if (a.details) console.log(`  Details: ${JSON.stringify(a.details)}`);
            });
        } else {
            // Try in main DB just in case
            const auditMain = dbMain.collection('audit_ingestion');
            const lastAuditMain = await auditMain.find({}).sort({ createdAt: -1 }).limit(3).toArray();
            console.log('--- MAIN DB AUDITS ---');
            lastAuditMain.forEach(a => {
                console.log(`- Audit ID: ${a._id}, Status: ${a.status}, Filename: ${a.filename}, Message: ${a.message || 'no msg'}`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

main();
