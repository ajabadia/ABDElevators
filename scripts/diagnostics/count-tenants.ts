import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { connectDB } from '../src/lib/db';

async function countTenants() {
    try {
        const db = await connectDB();
        const total = await db.collection('tenants').countDocuments();
        const tenants = await db.collection('tenants').find({}, { projection: { name: 1, tenantId: 1 } }).toArray();

        console.log(`\n📊 Total de tenants registrados: ${total}`);
        console.log('-----------------------------------');
        tenants.forEach(t => {
            console.log(`- ${t.name} (${t.tenantId})`);
        });
        console.log('-----------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('Error counting tenants:', error);
        process.exit(1);
    }
}

countTenants();
