
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function check() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();

        console.log('| DB | Collection | Email | Role | TenantId |');
        console.log('|----|------------|-------|------|----------|');

        const authDb = client.db('ABDElevators-Auth');
        const authUsers = await authDb.collection('users').find({}).toArray();
        authUsers.forEach(u => {
            console.log(`| Auth | users | ${u.email} | ${u.role} | ${u.tenantId} |`);
        });

        const mainDb = client.db('ABDElevators');
        const mainUsers = await mainDb.collection('users').find({}).toArray();
        mainUsers.forEach(u => {
            console.log(`| Main | users | ${u.email} | ${u.role} | ${u.tenantId} |`);
        });

        const mainUsuarios = await mainDb.collection('usuarios').find({}).toArray();
        mainUsuarios.forEach(u => {
            console.log(`| Main | usuarios | ${u.email} | ${u.role} | ${u.tenantId} |`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

check();
