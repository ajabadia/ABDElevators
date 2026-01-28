import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function countTenants() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI no encontrada en .env.local');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const total = await db.collection('tenants').countDocuments();
        const tenants = await db.collection('tenants').find({}, { projection: { name: 1, tenantId: 1 } }).toArray();

        console.log(`\n📊 Total de tenants registrados: ${total}`);
        console.log('-----------------------------------');
        tenants.forEach(t => {
            console.log(`- ${t.name} (${t.tenantId})`);
        });
        console.log('-----------------------------------\n');

    } catch (error) {
        console.error('Error counting tenants:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

countTenants();
