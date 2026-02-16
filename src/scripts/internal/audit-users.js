
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function audit() {
    const uri = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();

        const dbs = ['ABDElevators', 'ABDElevators-Auth'];
        for (const dbName of dbs) {
            const db = client.db(dbName);
            const users = await db.collection('users').find({}).toArray();
            console.log(`[DB: ${dbName}] Users Count: ${users.length}`);
            users.forEach(u => {
                console.log(`  - ${u.email} [Role: ${u.role}] [Tenant: ${u.tenantId}]`);
            });
        }
    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        await client.close();
    }
}

audit();
