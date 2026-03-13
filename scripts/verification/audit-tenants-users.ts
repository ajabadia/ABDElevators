import { MongoClient } from 'mongodb';

async function auditTenantsAndUsers() {
    console.log('[DEBUG] Auditing Tenants and Users...');
    const authUri = 'mongodb+srv://ajabadia03_db_user:Ajabafan1974@cluster0.xarmew0.mongodb.net/';
    const client = new MongoClient(authUri);

    try {
        await client.connect();
        const db = client.db('ABDElevators-Auth');
        
        const tenants = await db.collection('tenants').find({}).toArray();
        console.log(`[DEBUG] Total Tenants: ${tenants.length}`);
        tenants.forEach(t => console.log(`  - Tenant: ${t.name} | ID: ${t._id} | slug: ${t.slug}`));

        const users = await db.collection('users').find({}).toArray();
        console.log(`[DEBUG] Total Users: ${users.length}`);
        users.forEach(u => console.log(`  - User: ${u.email} | ID: ${u._id} | Tenant: ${u.tenantId} | Role: ${u.role}`));

    } catch (error) {
        console.error('[DEBUG ERROR]', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

auditTenantsAndUsers();
